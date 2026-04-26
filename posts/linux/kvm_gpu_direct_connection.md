---
title: KVM-QEMU配置显卡直通以及性能优化
author: LengineerC
time: 2026-04-25 21:04:19
abstract: ''
lock: false
password: ''
top: true
tags:
  - KVM
  - Linux
---

> 本文为[热切换显卡直通](https://github.com/SHORiN-KiWATA/Shorin-ArchLinux-Guide/wiki/%E7%83%AD%E5%88%87%E6%8D%A2%E6%98%BE%E5%8D%A1%E7%9B%B4%E9%80%9A)和[KVM虚拟机](https://github.com/SHORiN-KiWATA/Shorin-ArchLinux-Guide/wiki/KVM%E8%99%9A%E6%8B%9F%E6%9C%BA)在天选4笔记本的实践记录。

近日突发奇想想用linux玩洛克王国，可惜腾讯ACE支持SteamOS也不给Arch添加白名单。在使用proton转译之后，还是无法正常打开游戏，最后还是只能使用在linux上运行windows虚拟机的方式来运行。

## 安装

先简单说明一下KVM以及QEMU的关系：KVM是虚拟机引擎，可以直接调用物理CPU硬件虚拟化指令执行计算以及硬件加速。QEMU则是负责硬件模拟（主板，显卡，网卡等），QEMU也可以模拟CPU,但是如果采用纯软件的方式翻译执行CPU指令，性能会极其低下，因此需要两者结合。QEMU负责指令转发，KVM负责调用物理硬件从而提高执行效率。

先安装QEMU本体以及其依赖组件

```bash
sudo pacman -S qemu-full virt-manager swtpm dnsmasq
```

之后开启[libvirt](https://wiki.archlinux.org.cn/title/Libvirt)守护进程，其作用是提供了一种管理虚拟机和其他虚拟化功能（如存储和网络接口管理）的便捷方式。这些软件包括一个长期稳定的 C API、一个守护进程 (libvirtd) 和一个命令行实用程序 (virsh)。libvirt 的主要目标是为管理多个不同的虚拟化提供商/Hypervisor 提供统一的接口。

再开启NAT, 以便后续直接通过桥接的方式分享网络给虚拟机

```bash
sudo virsh net-start default
sudo virsh net-autostart default
```

再给当前用户添加组权限

```bash
sudo usermod -a -G libvirt $(whoami)
```

### 镜像下载

本文使用的系统是Win11, 可以去[MSDN](https://next.itellyou.cn/Original/Index)上面下载，此外还需要一个类似VMWare Tools的镜像，用于安装系统时自动检测硬件，安装后自动安装驱动以及分辨率适配：[virtio-win-tools](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/archive-virtio/?C=M;O=D)下载最新的iso即可。

## 创建虚拟机

_当前虚拟机只是用来打游戏，暂时没有配置文件共享的需求。有需要的可以自行去原文链接配置。_
在创建虚拟机的最后一步，需要点击**在安装前自定义配置**的选项。在创建虚拟机之后，需要更进一步的设置。

### CPU

想要最大优化虚拟机的性能，CPU配置必须拉满。我的R9-7940H就是8核心16线程。虚拟机的CPU也可以直接复刻参数，不要超过实际参数大小即可。
![cpu-setting.png](https://files.seeusercontent.com/2026/04/25/mwX8/cpu-setting.png)

### 内存

我设置的是我物理内存一半的大小（32GB / 2 = 16GB），记得选中**启用共享内存**。

### 磁盘

虚拟机创建的硬盘设置为`VirtIO`。其余系统镜像盘之类的保持默认`SATA CDROM`。

### 网络接口

设备型号也是设置为`VirtIO`。同时设置网络源为**桥接**。
![nic-setting.png](https://files.seeusercontent.com/2026/04/25/bf1O/nic-setting.png)

目前就设置这些内容，其他的安装完系统之后再进行设置。

### 安装系统

没啥好说的，和平时装系统一样修改引导顺序进入安装引导点下一步即可。只需要注意一点，在选择安装Windows11的位置这个界面的时候，可能不会显示新建虚拟机时创建的磁盘，需要手动点击加载驱动（Load Driver）, 选择`virtio-win`的驱动盘，进入`viostor`文件夹，选择`w11`下的`amd64`。选中后点击自动安装磁盘驱动，就可以选中创建虚拟机时的硬盘了。

安装完成后，在文件管理器中进入`virtio-win`的驱动盘，里面有个`virtio-win-guest-tools.exe`，右键管理员运行，进度条跑完后则完成基础安装，然后关机。

## 显卡直通

> 该显卡直通基于双显卡（核显+独显），单显卡直通请自行另查教程

前提：**华硕电脑务必开启混合模式（Windows默认）**，有外接显示器的把连接线插在**核显输出口**（不然会黑屏）。使用命令`sudo dmesg | grep -e DMAR -e IOMMU`检查是否开启IOMMU（有输出即可）。调整完成后最好自己检查一下笔记本自带屏幕在内的所有屏幕是否都是核显输出。**一定要确认之后再进行后续步骤！！！**

### 确定文件名

查看nvidia的`drm`文件名

```bash
ls -l /sys/class/drm/card*/device/driver
ls -l /sys/class/drm/render*/device/driver
```

类似输出：

```
lrwxrwxrwx 1 root root 0  4月25日 20:54 /sys/class/drm/card0/device/driver -> ../../../../bus/pci/drivers/nvidia
lrwxrwxrwx 1 root root 0  4月25日 20:54 /sys/class/drm/card1/device/driver -> ../../../../bus/pci/drivers/amdgpu
lrwxrwxrwx 1 root root 0  4月25日 20:54 /sys/class/drm/renderD128/device/driver -> ../../../../bus/pci/drivers/amdgpu
lrwxrwxrwx 1 root root 0  4月25日 20:54 /sys/class/drm/renderD129/device/driver -> ../../../../bus/pci/drivers/nvidia
```

记住所有带`nvidia`的文件名：`card0`和`renderD128`，这两个文件名因人而异且会随机分配，因此需要用下面的命令再进一步确定其pci路径：

```bash
ls -l /dev/dri/by-path/
```

输出如下：

```
lrwxrwxrwx 1 root root  8  4月25日 20:49 pci-0000:01:00.0-card -> ../card0
lrwxrwxrwx 1 root root 13  4月25日 20:49 pci-0000:01:00.0-render -> ../renderD129
lrwxrwxrwx 1 root root  8  4月25日 14:08 pci-0000:66:00.0-card -> ../card1
lrwxrwxrwx 1 root root 13  4月25日 14:08 pci-0000:66:00.0-render -> ../renderD128
```

记住之前的文件名对应的`pci-xxxx:xx....`，后面会用

### 杀死进程

再查看所有在n卡上运行的进程：

```bash
sudo fuser -v /dev/nvidia*
sudo fuser -v /dev/dri/card0
sudo fuser -v /dev/dri/renderD129
```

类似输出：

```
                     用户     进程号 权限   命令
/dev/nvidiactl:      lengineerc  139584 F.... code
                     lengineerc  146370 F.... obsidian
                     用户     进程号 权限   命令
/dev/dri/renderD129: lengineerc  139584 F.... code
                     lengineerc  146370 F.... obsidian
```

**特别注意一点**：如果你的**linux桌面环境或窗口管理器**运行在n卡上，需要特殊处理。原文中的例子是niri, 恰好我使用的也是niri, 因此在此只能给出niri的解决方案，需要其他方案请另外搜寻。如果桌面环境或窗口管理器没有运行在n卡上的，可以直接跳过下面有关niri的一步。

niri的配置文件一般在`/home/user/.config/niri/config.kdl`中，编辑该文件，在`debug`项中添加下面两行，排除之前获取的pci路径，然后重启niri即可。

```
ignore-drm-device "/dev/dri/by-path/pci-0000:01:00.0-card"
ignore-drm-device "/dev/dri/by-path/pci-0000:01:00.0-render"
```

然后使用杀死运行在n卡上的所有进程（最好多运行几遍，防止个别进程重启）

```bash
sudo fuser -k -9 /dev/nvidia*
```

### 移除模块

再按顺序移除nvidia的所有模块（也最好多运行几遍）

```bash
sudo rmmod nvidia_drm
sudo rmmod nvidia_modeset
sudo rmmod nvidia_uvm
sudo rmmod nvidia
```

当四个`rmmod`都报错：`ERROR: Module nvidia_drm is not currently loaded`就好了。

### 解绑驱动

使用下面命令确认和n卡同IOMMU（输入/输出内存管理单元）组的pci地址。因为IOMMU 组是主板硬件层面上，能够被独立隔离并分配给虚拟机的最小设备集合。

```bash
for d in /sys/kernel/iommu_groups/*/devices/*; do
    n=${d#*/iommu_groups/*}; n=${n%%/*}
    printf 'IOMMU Group %s ' "$n"
    lspci -D -nns "${d##*/}"
done
```

输出（可见两个都在Groups 15）：

```
IOMMU Groups 15 0000:01:00.0 VGA compatible controller [0300]: NVIDIA Corporation AD107M [GeForce RTX 4060 Max-Q / Mobile] [10de:28e0] (rev a1)
IOMMU Groups 15 0000:01:00.1 Audio device [0403]: NVIDIA Corporation AD107 High Definition Audio Controller [10de:22be] (rev a1)
```

像我这个RTX 4060 Laptop就带个音频控制器，显卡不同组内单元数量也就不同。比如我这个就要先记住`0000:01:00.0`和`0000:01:00.1`两个物理硬件地址，后续必须把组内所有单元**一起处理**，不能剩下任何一个。

先查看一下组内每个单元对应的驱动：

```bash
lspci -Dk
```

输出：

```
0000:01:00.0 VGA compatible controller: NVIDIA Corporation AD107M [GeForce RTX 4060 Max-Q / Mobile] (rev a1)
	Subsystem: ASUSTeK Computer Inc. Device 199d
	Kernel driver in use: nvidia
	Kernel modules: nouveau, nvidia_drm, nvidia
0000:01:00.1 Audio device: NVIDIA Corporation AD107 High Definition Audio Controller (rev a1)
	Subsystem: ASUSTeK Computer Inc. Device 199d
	Kernel driver in use: snd_hda_intel
	Kernel modules: snd_hda_intel
```

只需要关注物理硬件地址和`Kernel driver in use`后面的内容即可

然后进行驱动解绑，如果有不同的内容请自行增减对应命令（记得把引号内容还有`/sys/bus/pci/drivers/xxx/unbind`中的驱动名称替换为实际的）：

```bash
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers/nvidia/unbind # 该命令在rmmod时可能会解绑，报错是正常情况
echo "0000:01:00.1" | sudo tee /sys/bus/pci/drivers/snd_hda_intel/unbind
```

### vfio接管

```bash
# 加载vfio模块
sudo modprobe vfio-pci

# 覆盖驱动为vfio(有不同的内容请自行增减，物理硬件地址记得换)
echo "vfio-pci" | sudo tee /sys/bus/pci/devices/0000:01:00.0/driver_override
echo "vfio-pci" | sudo tee /sys/bus/pci/devices/0000:01:00.1/driver_override

# 重新扫描设备绑定vfio(有不同的内容请自行增减，物理硬件地址记得换)
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers_probe
echo "0000:01:00.1" | sudo tee /sys/bus/pci/drivers_probe
```

执行完成无报错之后，使用下面命令验证：

```bash
lspci -k | grep -A 2 -i nvidia
```

输出：

```
pcilib: Error reading /sys/bus/pci/devices/0000:00:08.3/label: Operation not permitted
01:00.0 VGA compatible controller: NVIDIA Corporation AD107M [GeForce RTX 4060 Max-Q / Mobile] (rev a1)
	Subsystem: ASUSTeK Computer Inc. Device 199d
	Kernel driver in use: vfio-pci
	Kernel modules: nouveau, nvidia_drm, nvidia
01:00.1 Audio device: NVIDIA Corporation AD107 High Definition Audio Controller (rev a1)
	Subsystem: ASUSTeK Computer Inc. Device 199d
	Kernel driver in use: vfio-pci
```

`Kernel driver in use`字段为`vfio-pci`则接管成功。

### 虚拟机配置

现在回到虚拟机配置中，点击添加硬件弹出下面的窗口：
![add_gpu.png](https://files.seeusercontent.com/2026/04/25/H7dq/add_gpu.png)

在PCI主机设备中选中显卡添加。之后再次开启虚拟机，**安装对应显卡驱动**，然后英伟达控制面板中凭个人喜好设置。然后关机。至此显卡直通配置完毕。

## 性能优化

原文章中提供了很多的性能优化方式，在此我列举一下从中选取的一些效果明显的设置。

### 禁用memballoon

禁用后可以减少虚拟机内存转移，效果立竿见影，找到虚拟机XML中的`memballoon`选项（一般是`devices中的最后一个`），将其`model`设置为`none`：

```shell
<memballoon model="none"/>
```

### 开启内存大页

分两种设置，一种2MB还有个1GB。1GB适用于64GB往上的物理内存使用，我只有32GB,就写2MB的设置了。

首先需要在虚拟机的XML的`memoryBacking`选项中添加`hugepages`

```xml
  <memoryBacking>
    <hugepages/>
  </memoryBacking>
```

有两种形式配置大页数量，一种是永久写死，一种是临时动态配置。先说临时配置。

#### 临时配置

首先清理内存碎片和缓存：

```bash
sudo sync
echo 3 | sudo tee /proc/sys/vm/drop_caches
echo 1 | sudo tee /proc/sys/vm/compact_memory
```

在分配内存大页，我设置的是虚拟机内存的一半：

```bash
sysctl -w vm.nr_hugepages=8192
```

分配好后可以使用下面的命令验证是否为设置的值：

```bash
cat /proc/sys/vm/nr_hugepages
```

#### 配置文件永久生效

编辑`/etc/sysctl.d/40-hugepage.conf`文件（没有就新建），写入

```
vm.nr_hugepages = 8192
```

保存重启电脑后就会生效。

这里要先说明一下物理内存占用的问题，按我的设置（虚拟机内存16GB,大页内存8GB）为例：大页内存会**强行占用**，不管虚拟机是否开启，这8GB会永远在物理内存中扣除，所以这也是我没有选用配置文件把大页内存大小写死的原因。

> 现在可以打开虚拟机看一下能否正常启动，如果报错`qemu-system-x86_64: unable to map backing store for guest RAM: Cannot allocate memory`，就按照上面的命令清理一下清理内存碎片和缓存再重新打开就可以解决。

## 屏幕共享

之前创建虚拟机时设置的共享内存就会在这个地方生效，[LookingGlass](https://github.com/gnif/LookingGlass)会使用共享内存来实现屏幕分享。现在可以打开虚拟机，查看任务管理器，会发现spice或vnc显示的虚拟机画面不会调用一点显卡，所以还需要一个虚拟显示器来诱骗显卡直接接入。有诱骗器的可以直接用，没有的可以使用[Virtual-Display-Driver](https://github.com/VirtualDrivers/Virtual-Display-Driver)创建一个虚拟显示器。VDD需要在windows内安装，下载完成后打开点击install就安装完毕不用再管了。

### 文件配置

回到linux, 使用`group`查看当前用户是否在`kvm`组内，没有就使用`sudo gpasswd -a $USER kvm`添加，然后注销用户重新登录。

接下来设置LookingGlass的共享内存大小，计算公式是：

$$内存大小（MB）= \dfrac{分辨率宽度 \times 分辨率高度 \times 4 \times 2}{1024 \times 1024}$$

原文档内的简单判断方法：

- 1080p非高刷32MB
- 1080p高刷或2k高刷64MB
- 2k超高刷或4K高刷128MB

然后安装kvmfr内核

```bash
yay -S --needed linux-headers looking-glass-module-dkms-git
```

安装完成后需要配置一系列文件（没有就新建）：

- 配置`/etc/modprobe.d/kvmfr.conf`文件中的共享内存大小（MB）

```
options kvmfr static_size_mb=128
```

- 往`/etc/modules-load.d/kvmfr.conf`内写入：

```
kvmfr
```

- 然后是`/etc/udev/rules.d/99-kvmfr.rules`，要把`username`换成当前用户名

```
SUBSYSTEM=="kvmfr", OWNER="username", GROUP="kvm", MODE="0660"
```

- 最后是`/etc/libvirt/qemu.conf`，取消下面配置的注释，并新增`"/dev/kvmfr0"`

```
cgroup_device_acl =[
    "/dev/null", "/dev/full", "/dev/zero",
    "/dev/random", "/dev/urandom",
    "/dev/ptmx", "/dev/kvm", "/dev/kqemu",
    "/dev/rtc","/dev/hpet", "/dev/vfio/vfio",
    "/dev/kvmfr0"
]
```

_如果使用了AppArmor的自行去原文档查看对应配置_

### 虚拟机配置

把虚拟机XML开头的`<domain type='kvm'>`替换为`<domain xmlns:qemu="http://libvirt.org/schemas/domain/qemu/1.0" type="kvm">`，然后在最底部的`</domain>`上面添加

```xml
<qemu:commandline>
  <qemu:arg value="-device"/>
  <qemu:arg value="{'driver':'ivshmem-plain','id':'shmem0','memdev':'looking-glass'}"/>
  <qemu:arg value="-object"/>
  <qemu:arg value="{'qom-type':'memory-backend-file','id':'looking-glass','mem-path':'/dev/kvmfr0','size':<size>,'share':true}"/>
</qemu:commandline>
```

其中`<size>`替换为之前计算出的$共享内存大小\times 1024 \times 1024$。

然后关闭虚拟显卡，在`<devices>`中查找`<video>`，修改为：

```xml
<video>
  <model type="none"/>
</video>
```

最后确认有声卡`ich9`，并且标签内的`audio`标签的`type`为`spice`：

```xml
<audio id='1' type='spice'/>
```

然后运行虚拟机，安装[LookingGlass host](https://looking-glass.io/downloads)，选择Download中的Windows Host下载安装完成后，就配置完成了。

### 安装Looking Glass客户端

回到linux, 通过AUR安装客户端：

```bash
yay -S looking-glass-git
```

不巧的是我正好遇到AUR被攻击无法访问，所以直接拉的[源码](https://github.com/gnif/LookingGlass)构建。

之后就可以启动虚拟机，然后回linux打开Looking Glass客户端使用高性能虚拟机了。

## 恢复配置

### 关闭显卡直通

> **虚拟机必须处于完全关闭状态才可以后续操作！！！**

记得把下面代码中的所有物理硬件地址换为本机实际地址：

```bash
# 移除驱动覆盖
echo "" | sudo tee /sys/bus/pci/devices/0000:01:00.0/driver_override
echo "" | sudo tee /sys/bus/pci/devices/0000:01:00.1/driver_override

# 解绑vfio
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/unbind
echo "0000:01:00.1" | sudo tee /sys/bus/pci/drivers/vfio-pci/unbind

# 重新加载nvidia模块
sudo modprobe nvidia
sudo modprobe nvidia_drm
sudo modprobe nvidia_modeset
sudo modprobe nvidia_uvm

# 重新检测，激活显卡
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers_probe
echo "0000:01:00.1" | sudo tee /sys/bus/pci/drivers_probe
```

### 释放内存大页（针对2MB配置）

#### 临时配置的释放

```bash
sysctl -w vm.nr_hugepages=0

# 用于确认
cat /proc/sys/vm/nr_hugepages
```

#### 文件配置的释放

```bash
sudo rm /etc/sysctl.d/40-hugepage.conf
```

运行后重启就会释放

## 总结

亲自体验了一次一趟操作下来性能损耗在接受范围内，更多选项和优化还是参照[原文](https://github.com/SHORiN-KiWATA/Shorin-ArchLinux-Guide/wiki/KVM%E8%99%9A%E6%8B%9F%E6%9C%BA)
