---
title: "KVM复用实体Windows 11"
author: "LengineerC"
time: "2026-11-23 19:38:02"
abstract: ""
lock: false
password: ""
top: true
tags:
  - KVM
  - Linux
---

> **适用场景**：Arch Linux 与 Windows 11 位于同一块物理 NVMe SSD；希望在物理启动 Windows 和 Arch 内的 KVM Windows 之间复用**同一个 NTFS 系统分区**，同时将 NVIDIA 显卡直通给虚拟机。本文只覆盖**物理分区映射、虚拟 EFI、Windows 引导、VirtIO SCSI、VFIO、`winvm` / `mdadm linear` 管理**；不讨论 HugePages、CPU Pinning、Looking Glass 的配置。
>
> **风险提示**：这是高风险的共享系统盘方案。操作前备份 Windows 的重要数据、BitLocker 恢复密钥及虚拟 EFI 文件。**同一时间只能有一套 Windows 使用这个 NTFS 分区**。不要把运行 Arch 的整块 NVMe 设备直通给虚拟机。本文中的设备路径和扇区数来自这台机器的实际布局，移植到别的电脑时必须重新核对，不能照抄。

## 0. 目标结构与已知分区

物理 SSD 为 `/dev/nvme0n1`，Arch 和 Windows 共盘。本文实际使用的 Windows 数据分区是 `/dev/nvme0n1p3`：

| 物理分区         | 用途                              | 大小／说明                             |
| ---------------- | --------------------------------- | -------------------------------------- |
| `/dev/nvme0n1p1` | **实体 Windows EFI**              | 200 MiB；只供物理 Windows 启动         |
| `/dev/nvme0n1p2` | Windows MSR                       | 16 MiB                                 |
| `/dev/nvme0n1p3` | **实体 Windows 11 NTFS 系统分区** | 634859520 个 512B 扇区（约 302.7 GiB） |
| `/dev/nvme0n1p4` | Windows 恢复分区                  | 约 954 MiB                             |
| `/dev/nvme0n1p5` | Arch EFI                          | 1 GiB                                  |
| `/dev/nvme0n1p6` | Arch Btrfs                        | 约 649 GiB                             |

**禁止**将整个 `/dev/nvme0n1` 作为 QEMU 磁盘：虚拟机可能写入正在由宿主机使用的 Arch 分区、GPT 或 EFI。采用 `mdadm --build --level=linear` 将三个片段顺序映射成一个只向虚拟机暴露 Windows 的逻辑 GPT 磁盘：

```text
虚拟磁盘 /dev/md/winvm  （实际可能显示 /dev/md127）
┌─────────────────────────┬─────────────────────────────────┬──────────────────────┐
│ efi-head.img            │ /dev/nvme0n1p3                  │ gpt-tail.img         │
│ 128 MiB                 │ 634859520 sectors               │ 1 MiB                │
│ 虚拟主 GPT + 虚拟 ESP   │ 原封不动的实体 Windows NTFS     │ 虚拟备份 GPT         │
└─────────────────────────┴─────────────────────────────────┴──────────────────────┘
                 ↓ 虚拟 GPT 分区表
  p1: EFI，起始 2048，末尾 262143；p2: NTFS，起始 262144，末尾 635121663
```

计算核对：`262144 + 634859520 + 2048 = 635123712` 个扇区，对应整个 MD 设备约 **302.85 GiB**。虚拟 EFI 分区为 **260096 个扇区（127 MiB）**；前 1 MiB 用于 GPT 和对齐。虚拟 NTFS 的第一个扇区正好是实体 `/dev/nvme0n1p3` 的第一个扇区。

## 1. 第一次创建前的安全检查

先在**实体 Windows** 的管理员 PowerShell 中关闭休眠和快速启动：

```powershell
powercfg /h off
shutdown /s /t 0
```

如果启用了 BitLocker／设备加密，预先备份恢复密钥，并明确当前 Windows 分区是否加密；切换虚拟 TPM 与实体 TPM 可能触发恢复。请确保 Windows 真正关机，而非休眠。随后进入 Arch：

```bash
sudo pacman -S --needed mdadm gptfdisk util-linux qemu-full libvirt virt-manager
lsblk -o NAME,PATH,START,SIZE,FSTYPE,MOUNTPOINTS /dev/nvme0n1
sudo blockdev --getss /dev/nvme0n1p3
sudo blockdev --getsz /dev/nvme0n1p3
findmnt --source /dev/nvme0n1p3
sudo virsh -c qemu:///system domstate win11 2>/dev/null || true
```

这台机器应为 **512 字节逻辑扇区**、**634859520 个扇区**。`findmnt` 不应有输出。若磁盘布局、分区尺寸或逻辑扇区大小不同，先重新计算所有 GPT 边界，不要直接运行后面的 `sgdisk` 命令。

> **只执行一次的操作**：下一节中的 `truncate`、`sgdisk --clear`、`mkfs.vfat`、Windows `bcdboot` 是虚拟磁盘首次初始化步骤。**如果你的 `/var/lib/libvirt/win-physical/*.img` 已经包含之前可启动的虚拟 EFI/GPT，就不要重复初始化！**

## 2. 首次构建 MD Linear 虚拟磁盘

### 2.1 创建头尾文件（仅首次）

```bash
sudo mkdir -p /var/lib/libvirt/win-physical
sudo truncate -s 128M /var/lib/libvirt/win-physical/efi-head.img
sudo truncate -s 1M /var/lib/libvirt/win-physical/gpt-tail.img
```

头文件以后会保存虚拟 GPT、FAT32 ESP 和 Windows Boot Manager；尾文件保存备份 GPT。它们**不是可随意删除的缓存**，应连同 Windows 数据定期备份。

### 2.2 附加 Loop 并组装阵列

```bash
HEAD=$(sudo losetup --find --show /var/lib/libvirt/win-physical/efi-head.img)
TAIL=$(sudo losetup --find --show /var/lib/libvirt/win-physical/gpt-tail.img)
printf 'HEAD=%s\nTAIL=%s\n' "$HEAD" "$TAIL"

sudo mdadm --build /dev/md/winvm \
  --level=linear --raid-devices=3 --chunk=512 \
  "$HEAD" /dev/nvme0n1p3 "$TAIL"

sudo udevadm settle
sudo mdadm --detail /dev/md/winvm
sudo blockdev --getsz /dev/md/winvm
```

在本机输出应为 `635123712` 扇区，成员顺序依次是**头 Loop → 真实 NTFS → 尾 Loop**。`--chunk=512` 是这个已经验证的阵列采用的参数，不要在后续恢复时擅自改变。

### 2.3 在**虚拟 MD 设备**上创建 GPT（仅首次）

⚠️ 下列命令会**清空目标设备的 GPT**。务必确认目标是新组装的 **`/dev/md/winvm`**，绝不是 `/dev/nvme0n1` 或 `/dev/nvme0n1p3`。

```bash
sudo sgdisk --clear \
  --new=1:2048:262143 --typecode=1:EF00 --change-name=1:'Windows VM EFI' \
  --new=2:262144:635121663 --typecode=2:0700 --change-name=2:'Windows 11' \
  /dev/md/winvm

sudo partprobe /dev/md/winvm
sudo udevadm settle
sudo sgdisk -v /dev/md/winvm
lsblk -o NAME,PATH,START,SIZE,FSTYPE /dev/md/winvm
```

如果映射为 `/dev/md127`，虚拟 ESP 是 `/dev/md127p1`，映射 Windows NTFS 是 `/dev/md127p2`。分区号也可用 `readlink -f /dev/md/winvm` 动态确定。

### 2.4 只格式化虚拟 EFI（仅首次）

```bash
MD_REAL=$(readlink -f /dev/md/winvm)
sudo mkfs.vfat -F 32 -n WINVM_EFI "${MD_REAL}p1"
```

**绝对不要对 `${MD_REAL}p2` 或 `/dev/nvme0n1p3` 执行 `mkfs`。**

### 2.5 验证 NTFS 零偏移映射

```bash
sudo blockdev --getsz /dev/md/winvm      # 635123712
sudo blockdev --getsz "${MD_REAL}p2"     # 634859520
sudo cmp -n 4096 "${MD_REAL}p2" /dev/nvme0n1p3 && echo 'NTFS mapping OK'
sudo sgdisk -v /dev/md/winvm
```

`cmp` 返回 `0` 代表前 4096 字节完全一致。这只能检查映射起始位置，不是整个 NTFS 的完整一致性校验。

## 3. 建立 KVM 虚拟机与独立 Windows EFI 引导

### 3.1 虚拟机基础设置

在 Virt-manager 创建 Windows 11 虚拟机，使用：

- 连接：`qemu:///system`，芯片组：Q35，固件：OVMF UEFI。
- CPU：`host-passthrough`；内存、核数按需要分配。
- 先用 **QXL/SPICE 虚拟显卡**完成安装和诊断，后续 VFIO 验证后再禁用虚拟显卡。
- 将已有磁盘 **`/dev/md/winvm` 作为整个块设备**添加，初始使用 **SATA** 总线（Windows 自带 AHCI 启动驱动）；不是将 `/dev/md127p2` 单独作为启动盘。
- 临时挂载 Windows 安装 ISO，用于 WinPE 重建**虚拟 EFI** 中的 Windows Boot Manager。

磁盘 XML 初始示例：

```xml
<disk type="block" device="disk">
  <driver name="qemu" type="raw" cache="none" io="native"/>
  <source dev="/dev/md/winvm"/>
  <target dev="sda" bus="sata"/>
  <boot order="2"/>
</disk>
```

临时让 Windows 安装 ISO 的 CD-ROM `<boot order="1"/>`；不要同时设置冲突的启动顺序，也不要混合使用 `<os><boot dev=...>` 与每设备 `<boot order>`。

### 3.2 从安装 ISO 进入 WinPE

启动虚拟机，进入 Windows 安装程序后按 **Shift + F10** 打开命令提示符：

```text
diskpart
list disk
list volume
```

在本机首次操作时：Windows NTFS 原系统盘显示约 302 GiB；虚拟 EFI 为约 **127 MiB FAT32**，标签 `WINVM_EFI`。根据实际卷号给虚拟 EFI 指定盘符 `S:`：

```text
select volume <127MiB FAT32 卷号>
assign letter=S
exit
```

不要根据卷号盲选；先检查 Windows 实际盘符：

```cmd
dir C:\Windows\System32\winload.efi
```

如果 `C:` 不是 Windows 分区，改为实际盘符。随后**只往虚拟 EFI 写引导文件**：

```cmd
bcdboot C:\Windows /s S: /f UEFI
```

检查：

```cmd
dir S:\EFI\Microsoft\Boot\bootmgfw.efi
```

完成后通过 `wpeutil shutdown` 关机，移除安装 ISO 的优先启动顺序，并把 MD 系统盘改为 `<boot order="1"/>`。重新启动后应进入**原来的 Windows 11**。物理 `/dev/nvme0n1p1` EFI 不需要修改。

> 注意：`bcdboot /s S:` 使用指定的虚拟 ESP 创建启动文件，UEFI 选择引导项的方式还取决于 OVMF NVRAM 和 EFI 回退路径。如果启动后仍然回到 UEFI Shell，先通过 OVMF Boot Manager 检查虚拟 ESP 的引导项，不要对实体 EFI 操作。

## 4. SATA → VirtIO SCSI（先装驱动，再换系统盘）

初次采用 SATA 是为确保原 Windows 直接启动；稳定后再改为 VirtIO SCSI，减少 AHCI 设备模拟开销。**一定先安装 `vioscsi` 驱动，不能直接把引导盘总线改成 SCSI。**

### 4.1 添加临时测试盘

关机后在 Arch 创建一个独立的临时盘：

```bash
sudo qemu-img create -f raw /var/lib/libvirt/images/virtio-test.img 128M
```

Virt-manager → 虚拟机详情 → **添加硬件 → 存储**：选择该测试镜像，总线为 **SCSI**；控制器选择 **VirtIO SCSI**。也可以在 XML 中添加：

```xml
<controller type="scsi" index="0" model="virtio-scsi"/>
<disk type="file" device="disk">
  <driver name="qemu" type="raw"/>
  <source file="/var/lib/libvirt/images/virtio-test.img"/>
  <target dev="sdb" bus="scsi"/>
</disk>
```

原来的 Windows SATA 磁盘暂时不动。测试盘没有 `<boot order>`；**同一虚拟机内的磁盘 target 名不能重复**，避免此前遇到的 `target 'sda' duplicated for disks`。

### 4.2 Windows 中加载驱动

挂载 `virtio-win.iso`，启动 Windows；在管理员 PowerShell 中使用 ISO 实际盘符（例为 `D:`）：

```powershell
pnputil /add-driver "D:\vioscsi\w11\amd64\vioscsi.inf" /install
Get-PnpDevice -Class SCSIAdapter
```

检查出现状态正常的 **Red Hat VirtIO SCSI controller**。可在 SATA 模式下正常重启一次验证驱动。**不需要初始化或格式化临时盘**，不要在磁盘管理中误操作真实系统盘。

### 4.3 切换系统盘并删除测试盘

Windows **完整关机**后备份配置：

```bash
sudo virsh dumpxml --inactive win11 > ~/win11-sata-backup.xml
```

在 Virt-manager XML 编辑器中移除临时测试磁盘节点；保留 VirtIO SCSI 控制器；将 `/dev/md/winvm` 的磁盘节点改为：

```xml
<controller type="scsi" index="0" model="virtio-scsi"/>
<disk type="block" device="disk">
  <driver name="qemu" type="raw" cache="none" io="native"/>
  <source dev="/dev/md/winvm"/>
  <target dev="sda" bus="scsi"/>
  <boot order="1"/>
</disk>
```

删除原 SATA 磁盘的旧 `<address type="drive" .../>`，由 libvirt 分配新的 SCSI 地址。之后正常启动 Windows。若出现 `INACCESSIBLE_BOOT_DEVICE`，先关机、恢复 SATA XML（`sudo virsh define ~/win11-sata-backup.xml`），不要直接运行磁盘修复或重新分区。

确认虚拟机配置**不再引用** `/var/lib/libvirt/images/virtio-test.img` 后，才能删除测试文件：

```bash
sudo virsh dumpxml --inactive win11 | grep -F virtio-test.img || true
sudo rm -- /var/lib/libvirt/images/virtio-test.img
```

这里的 `rm` 仅针对明确的**临时测试文件**，绝不要删除 `efi-head.img`、`gpt-tail.img` 或 `/dev/md/winvm`。

## 5. `winvm`：恢复和停止 MD Linear 的管理脚本

`mdadm --build` 建立的是**没有持久 MD 超级块**的线性阵列。重启 Arch 后，`/dev/md/winvm` 会消失，两个 Loop 设备也可能改变编号；**不能指望普通 RAID 自动扫描永久恢复**。因此使用脚本按固定顺序重建：

- `sudo winvm start`：检测并恢复映射，验证关键几何结构。
- `sudo winvm stop`：只在 VM 已关机、相关文件系统没有挂载时停止映射并释放 Loop。
- `sudo winvm status`：输出 MD、Loop、实体 NTFS 和 VM 状态。
- `sudo winvm restart`：安全停止后再次恢复。

### 5.1 建立脚本

下面是根据这台机器已验证的大小、成员顺序整理的版本，**不执行 `sgdisk --clear`、`mkfs` 或 `truncate`**，可重复运行。它在执行 stop 前验证成员身份，避免停止误认的其他 MD 阵列。

保存为 `/usr/local/sbin/winvm`：

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
export LC_ALL=C

VM=win11
MD=/dev/md/winvm
PART=/dev/nvme0n1p3
BASE=/var/lib/libvirt/win-physical
HEAD_IMG="$BASE/efi-head.img"
TAIL_IMG="$BASE/gpt-tail.img"

# 本机经过核对的 512B 扇区数
WIN_SECTORS=634859520
MD_SECTORS=635123712
EFI_SECTORS=260096

log() { printf '[winvm] %s\n' "$*"; }
die() { printf '[winvm][ERROR] %s\n' "$*" >&2; exit 1; }
(( EUID == 0 )) || die '请使用 sudo'

vm_off() {
  local s
  s=$(virsh -c qemu:///system domstate "$VM") || die '无法读取 VM 状态'
  [[ "$s" == 'shut off' ]] || die "虚拟机未关机：$s"
}

check_files() {
  [[ -b "$PART" ]] || die 'Windows 实体分区不存在'
  [[ -f "$HEAD_IMG" && -f "$TAIL_IMG" ]] || die '虚拟 EFI/GPT 镜像文件缺失'
  [[ $(stat -c %s "$HEAD_IMG") == 134217728 ]] || die 'EFI 头文件大小不符'
  [[ $(stat -c %s "$TAIL_IMG") == 1048576 ]] || die 'GPT 尾文件大小不符'
  [[ $(blockdev --getss "$PART") == 512 ]] || die '实体分区逻辑扇区不是 512B'
  [[ $(blockdev --getsz "$PART") == "$WIN_SECTORS" ]] || die 'Windows 分区扇区数不符'
}

# 找到单个绑定到指定镜像的 Loop，禁止重入造成多个 Loop 别名
loop_for() {
  local -a loops=()
  mapfile -t loops < <(losetup -j "$1" | cut -d: -f1)
  (( ${#loops[@]} <= 1 )) || die "镜像存在重复 Loop 映射：$1"
  printf '%s' "${loops[0]:-}"
}

is_mounted() {
  findmnt -rn -S "$1" >/dev/null 2>&1
}

check_mounts() {
  local real
  is_mounted "$PART" && die '实体 Windows 分区已挂载'
  if [[ -b "$MD" ]]; then
    real=$(readlink -f "$MD")
    for d in "$MD" "${real}p1" "${real}p2"; do
      if [[ -b "$d" ]] && is_mounted "$d"; then
        die "$d 已挂载"
      fi
    done
  fi
}

verify() {
  local real h t
  [[ -b "$MD" ]] || die 'MD 设备不存在'
  [[ $(blockdev --getsz "$MD") == "$MD_SECTORS" ]] || die 'MD 总扇区数错误'
  real=$(readlink -f "$MD")
  [[ -b "${real}p1" && -b "${real}p2" ]] || die '虚拟分区节点缺失'
  [[ $(blockdev --getsz "${real}p1") == "$EFI_SECTORS" ]] || die 'EFI 分区大小错误'
  [[ $(blockdev --getsz "${real}p2") == "$WIN_SECTORS" ]] || die 'NTFS 分区大小错误'
  # 不使用 lsblk -ndo START：某些组合中 -d 会忽略分区拓扑信息
  [[ $(lsblk -nr -o START "${real}p1" | awk 'NR==1{print $1}') == 2048 ]] || die 'EFI 起点错误'
  [[ $(lsblk -nr -o START "${real}p2" | awk 'NR==1{print $1}') == 262144 ]] || die 'NTFS 起点错误'
  h=$(loop_for "$HEAD_IMG"); t=$(loop_for "$TAIL_IMG")
  [[ -n "$h" && -n "$t" ]] || die 'Loop 映射不存在'
  # 逐一匹配 mdadm --detail 中的 RaidDevice 号和物理成员
  mdadm --detail "$MD" | awk -v h="$h" -v w="$PART" -v t="$t" '
    $1==0 && $4==0 && $NF==h {a=1}
    $1==1 && $4==1 && $NF==w {b=1}
    $1==2 && $4==2 && $NF==t {c=1}
    END { exit !(a && b && c) }
  ' || die 'MD 成员或顺序不匹配'
  sgdisk -v "$MD" >/dev/null || die '虚拟 GPT 校验失败'
  cmp -s -n 4096 "${real}p2" "$PART" || die 'NTFS 起始数据映射不一致'
  log 'MD/GPT/NTFS 映射验证通过'
}

start() {
  vm_off
  check_files
  check_mounts
  if [[ -b "$MD" ]]; then verify; log '阵列已经存在'; return; fi

  local head tail head_new=0 tail_new=0
  head=$(loop_for "$HEAD_IMG")
  tail=$(loop_for "$TAIL_IMG")
  if [[ -z "$head" ]]; then head=$(losetup --find --show "$HEAD_IMG"); head_new=1; fi
  if [[ -z "$tail" ]]; then tail=$(losetup --find --show "$TAIL_IMG"); tail_new=1; fi

  # 仅清理本次创建的资源，保留之前就存在的 Loop
  if ! mdadm --build "$MD" --level=linear --raid-devices=3 --chunk=512 \
       "$head" "$PART" "$tail"; then
    (( tail_new == 0 )) || losetup -d "$tail" || true
    (( head_new == 0 )) || losetup -d "$head" || true
    die '组装失败'
  fi
  udevadm settle
  # 若验证失败，保留阵列供人工检查，不对含真实 NTFS 的设备自动执行强制拆卸
  verify
  log "已恢复 $MD（HEAD=$head, TAIL=$tail）"
}

stop() {
  vm_off
  check_files
  if [[ ! -b "$MD" ]]; then log '阵列不存在'; return; fi
  verify
  check_mounts
  local head tail
  head=$(loop_for "$HEAD_IMG")
  tail=$(loop_for "$TAIL_IMG")
  mdadm --stop "$MD" || die 'MD 正被使用，停止失败'
  [[ -z "$head" ]] || losetup -d "$head"
  [[ -z "$tail" ]] || losetup -d "$tail"
  log 'MD 已停止，Loop 已释放'
}

status() {
  if [[ -b "$MD" ]]; then
    mdadm --detail "$MD"
    lsblk -o NAME,PATH,START,SIZE,FSTYPE,MOUNTPOINTS "$MD"
  else
    log 'MD 未组装'
  fi
  losetup -j "$HEAD_IMG" || true
  losetup -j "$TAIL_IMG" || true
  lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS "$PART"
  virsh -c qemu:///system domstate "$VM" || true
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; start ;;
  status)  status ;;
  *) echo '用法：sudo winvm {start|stop|restart|status}'; exit 2 ;;
esac
```

安装并检查脚本：

```bash
sudo install -m 755 /path/to/your/winvm /usr/local/sbin/winvm
sudo bash -n /usr/local/sbin/winvm
sudo winvm status
```

**注意**：`/path/to/your/winvm` 需要替换为保存脚本的真实路径。也可以直接用 `sudoedit /usr/local/sbin/winvm` 粘贴上述代码。此脚本针对**固定磁盘布局**，仅作为本机管理工具；若 SSD 分区调整、设备名更换或存在其他使用该分区的虚拟机，必须重新评估，不能照搬。设备已被其他进程打开时，`mdadm --stop` 会失败，不要用强制手段清除占用。

### 5.2 常见故障与对应解释

**A. 重启后虚拟机报** `Cannot access storage file '/dev/md/winvm': No such file or directory`：MD Linear 没有持久超级块，先运行 `sudo winvm start`；启动 VM 之前核对 `sudo winvm status`。

**B. `cat /proc/mdstat` 提示不存在**：不必单凭该文件判断 MD 是否可用，以 `mdadm --detail /dev/md/winvm`、`lsblk` 和 `blockdev --getsz` 为准。

**C. 脚本提示 EFI 分区起点异常，但 `lsblk -o START` 看到 2048**：旧脚本使用 `lsblk -ndo START` 可能因为 `-d` 的设备过滤而得到异常输出；新版使用 `lsblk -nr -o START`。不能因此重新执行 `sgdisk --clear`。

**D. `target 'sda' duplicated for disks`**：临时测试盘与系统盘使用了同一 target 名称；修改测试盘名称或移除它，不需要改变物理 Windows 分区。

**E. 物理 Windows 与 KVM 时间差**：实体 Windows 若设置了 `RealTimeIsUniversal=1`，虚拟机的 RTC 建议 `<clock offset="utc">`，不要使用 `localtime`。

## 6. 日常启停与切换实体 Windows

### Arch → KVM Windows

```bash
sudo winvm start
sudo winvm status
sudo virsh -c qemu:///system start win11
```

启动前确保 Windows NTFS 不被 Arch 挂载、实体 Windows 已经完全关机，且虚拟机没有其他实例正在使用这块分区。

### KVM Windows → 实体 Windows

在 Windows 客体内正常关机：

```powershell
shutdown /s /t 0
```

回到 Arch：

```bash
sudo virsh -c qemu:///system domstate win11  # 应为 shut off
sudo winvm stop
sudo reboot
```

在 BIOS/UEFI 启动菜单选择物理 SSD 原有的 **Windows Boot Manager**。`winvm stop` 只清理临时映射，不删除虚拟 EFI 文件；**不要删除 `efi-head.img`、`gpt-tail.img`**。

### 只读查看实体 Windows 文件（维护场景）

在 VM **完全关闭**、`winvm stop` 成功、MD 不再存在后：

```bash
sudo mkdir -p /mnt/windows
sudo mount -t ntfs3 -o ro /dev/nvme0n1p3 /mnt/windows
# 查看完成后
sudo umount /mnt/windows
sudo winvm start
```

如果 Windows 仍处于休眠状态或挂载报“不安全”，不要用 `force` 或 `remove_hiberfile` 绕过保护。**严禁 Windows 客体运行期间让 Arch 再挂载同一 NTFS**。

---

### 参考资料

- [libvirt Domain XML（磁盘、SCSI 控制器、PCI Hostdev）](https://libvirt.org/formatdomain.html)
- [mdadm 手册](https://man7.org/linux/man-pages/man8/mdadm.8.html)
- [GNU Parted / GPT 工具与 `sgdisk` 文档](https://www.rodsbooks.com/gdisk/sgdisk-walkthrough.html)
- [VirtIO Windows 驱动 ISO](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/)

_本文按这台机器实际跑通的分区布局编写，属于技术操作记录，不是跨设备通用的一键脚本。_
