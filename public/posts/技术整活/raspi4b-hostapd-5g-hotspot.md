---
title: '树莓派4B使用hostapd开启5G热点'
author: 'LengineerC'
time: '2025-03-03 14:04:51'
abstract: '被校园网连接数折磨之后想出来的邪修解决方案（树莓派最有用的一集）'
lock: false
password: ''
top: true
tags:
  - 树莓派
  - 硬件
---

> 适用于树莓派RJ45口连接网线，使用树莓派自带的无线网卡开启AP的情况

## 前置
用网线连接树莓派的RJ45网口，可以使用DHCP自动分配的IP或者设置静态IP

## 系统配置
### 设置IP转发
因为Linux系统默认关闭了IP转发，所以要手动开启，编辑`/etc/sysctl.conf`，取消下列行的注释：
```ini
net.ipv4.ip_forward=1
```
然后应用配置：
```bash
sudo sysctl -p
```
### 设置有线接口的NAT
如果连接网线的接口为`eth0`，设置
```bash
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
```
*如果提示找不到命令iptables，先执行`sudo apt install iptables`*

设置后，每次树莓派重启就会重置NAT配置，因此需要持久化设置，通过安装`iptables-persistent`来保存规则：
```bash
sudo apt install iptables-persistent
sudo netfilter-persistent save
```
之后再次重启`dnsmasq`：
```bash
sudo systemctl restart dnsmasq
```

### 网络配置
如果树莓派使用的网络管理工具是`systemd-networkd`，先查看其状态
```bash
sudo systemctl status systemd-networkd
```
如果服务没有运行，先启动：
```bash
sudo systemctl enable systemd-networkd
sudo systemctl start systemd-networkd
```
再给无线网卡`wlan0`创建一个配置文件`/etc/systemd/network/wlan0.network`：
```ini
[Match]
Name=wlan0

[Network]
Address=192.168.10.1/24
DHCPServer=yes

[DHCPServer]
PoolOffset=100
PoolSize=100
EmitDNS=yes
DNS=8.8.8.8 8.8.4.4
```
- `Address=192.168.10.1/24`设置`wlan0`的IP地址，和下面`dnsmasq`配置保持一致
- `PoolOffset=100`和`PoolSize=100`，设置DHCP池的IP偏移量，并设置池大小，所以DHCP的IP池范围为`192.168.10.100`到`192.168.10.200`，和下面`dnsmasq`配置保持一致

## 配置dnsmasq
> 似乎可以不用配置（未测试）

### 安装`dnsmasq`
安装dnsmasq创建DHCP池实现连接热点自动分配ip
```bash
sudo apt install dnsmasq
```
### 配置
创建`/etc/dnsmasq.conf`，写入配置：
```ini
interface=wlan0
dhcp-range=192.168.10.100,192.168.10.200,255.255.255.0,24h
```
`dhcp-range`可以自定义为自己想要的ip段

之后重启`dnsmasq`服务：
```bash
sudo systemctl restart dnsmasq
```

## 配置hostapd
安装hostapd用于给无线网卡设置为AP模式
### 安装`hostapd`
```bash
sudo apt install hostapd
```
### 配置
创建`/etc/hostapd/hostapd.conf`，配置为：
```ini
interface=wlan0
country_code=US
driver=nl80211
ssid=<wifiname>
hw_mode=a
channel=149
ieee80211n=1
ieee80211ac=1
wmm_enabled=1
ht_capab=[HT40+][SHORT-GI-20]
vht_capab=[SHORT-GI-80]
vht_oper_chwidth=1
vht_oper_centr_freq_seg0_idx=155
wpa=2
wpa_passphrase=<password>
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP

```
其中: `ssid`为热点名称，`wpa_passphrase`为热点密码，可以自行设置

使用自定义配置启动hostapd：
```bash
sudo hostapd /etc/hostapd/hostapd.conf
```
如果报错类似：`hostapd failed to request a scan of neighboring bsses ret=-52 (invalid exchange)`，可以参考[Pi unable to use VHT with built in WiFi chip #3768](https://github.com/raspberrypi/linux/issues/3768)，下载[文件](https://drive.google.com/file/d/1AN7lC_kMJGGg5AJLhSRtlTRgIh9qJlaI/view)，将`.clm_blob`文件文件复制到`/lib/firmware/brcm/`目录
```bash
cp cyfmac43455-sdio.clm_blob /lib/firmware/brcm/brcmfmac43455-sdio.clm_blob
```
**注意文件名不一致！！！**
然后重启树莓派，再按之前的命令启动hostapd



## 总结
树莓派由于硬件限制，无线网卡在2.4GHz情况下热点的速率大概只有70Mb/s左右，开启5GHz信号和设置VHT为80MHz的情况下，Windows显示的连接速度为150Mb/s，从连接速度来看翻了一倍，使用[中国科学技术大学测速网站](https://test.ustc.edu.cn/)测试下载速度，原通过`nmcli`使用2.4GHz信号开启的热点下载速度大约为12Mb/s，改用5GHz后能跑到100多Mb/s，效果提升还是很明显。理论上树莓派4B的无线网卡能跑到千兆速度，~~但实在是优化不来~~。采用openWrt配置无线热点因为树莓派性能过于鸡肋，内存和CPU经常吃满卡死，只能采用这种折中的办法。**有条件还是得整一个正儿八经的路由器**~~<sub>或者Mac mini</sub>~~

## 外部引用参考
[[1] 树莓派4B创建5Ghz WiFi热点](https://www.hncldz.com/?p=541)