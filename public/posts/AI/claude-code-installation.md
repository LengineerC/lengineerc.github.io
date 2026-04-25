---
title: 'Claude Code安装并使用第三方API'
author: 'LengineerC'
time: '2026-03-27 22:35:55'
abstract: '记录一下Claude Code安装方式以及使用中转站API的小坑'
lock: false
password: ''
top: false
tags:
  - Claude Code
  - AI
---

## 安装
通过[Claude Code官网](https://code.claude.com/docs/zh-CN/overview)提供的命令行安装：
- mac, linux
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

- windows powershell
```ps
irm https://claude.ai/install.ps1 | iex
```
没什么好说的，等他下载完就行。

## 配置第三方API
我用的是[cc-switch](https://github.com/farion1231/cc-switch)。打开后新建供应商，填写API Key。

**重点：填写请求地址的时候一定不要以斜杠结尾，而且不要携带请求地址中的v1**

比如原链接是：
```plaintext
https://api.xxx.com/v1/
```
就只需要填写
```plaintext
https://api.xxx.com
```
模型映射填写你使用的中转站支持的模型名称即可，不一定非要claude，其他的如gpt之类的也行。

之后就可以进行vide coding了（