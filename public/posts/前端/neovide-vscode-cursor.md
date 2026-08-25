---
title: 'VSCode的仿Neovide光标动画'
author: 'LengineerC'
time: '2026-03-25 22:08:38'
abstract: '在VSCode中基于Custom Css and JS Loader复刻Neovide的灵魂之一的光标动画'
lock: false
password: ''
top: false
tags:
  - 前端
  - 美化
  - VSCode
---

Neovide的灵魂之一就是它的光标动画（~~我就是图这个才用neovim的~~），还好VSCode中有一个插件[Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css)，支持我们自己向注入CSS和JS，因此可以使用这个途径，直接写个注入脚本，检测VSCode编辑区的光标，然后挂载canvas实现动画效果。具体的动画实现参考[neovide: No Nonsense Neovim Client in Rust](https://github.com/neovide/neovide)的源码，至于光标的检测是参考的reddit上一个大佬的代码：[I made neovide alike cursor effect on vscode](https://www.reddit.com/r/vscode/comments/11e66xh/i_made_neovide_alike_cursor_effect_on_vscode/)。

# 实现效果

话不多说先看效果

## 单个光标

![single cursor](https://files.seeusercontent.com/2026/03/27/hQ7u/single-cursor.webp)

## 多个光标

![multi cursor](https://files.seeusercontent.com/2026/03/27/Fm6a/multi-cursor.webp)

# 现有问题

reddit上面大佬的代码只兼容单个光标，当有多个光标时，他的动画绑定就有问题，有时失效乱飘，但是他的代码在分屏时可以处理屏间光标跳转。对于我个人而言，多光标操作还是很频繁的，所以优先处理了多光标适配，大致原理就是给每个光标dom节点绑定一个自定义的id属性，但是由于分屏之后两个vscode两个分屏中的cursor不是同一个实例，所以原代码的跨屏动画就没有了，不过每个分屏中的动画还是能正常运行的。

# 使用方式

github链接：[LengineerC/vscode-neovide-cursor: A Neovide like cursor animation for VS Code](https://github.com/LengineerC/vscode-neovide-cursor/tree/main)

下载[neovide-cursor.js](https://github.com/LengineerC/vscode-neovide-cursor/blob/main/neovide-cursor.js "neovide-cursor.js")，或直接复制代码自己找个文件保存。

VSCode安装`Custom CSS and JS loader`插件，
向`settings.json`添加配置:

```json
"vscode_custom_css.imports": [
    "file:///C:/path/to/your/neovide-cursor.js"
]
```

然后`ctrl`+`shift`+`p`执行`Enable Custom CSS and JS`后重启VSCode即可

修改配置的话保存修改后重新执行`Enable Custom CSS and JS`或`Reload Custom CSS and JS`就行

有bug欢迎提出issue！！
