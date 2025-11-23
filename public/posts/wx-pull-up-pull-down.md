---
title: '微信小程序实现上拉加载下拉刷新'
author: 'LengineerC'
time: '2024-06-29 22:14:34'
lock: false
password: ''
top: false
categories: 
  - 笔记
  - 教程
tags: 
  - 前端
  - 微信小程序
---

## 使用场景
由于微信小程序本身的限制，使用浏览器中window那一套操作实现监测上下拉大概率是不太行的（微信魔改的那一套渲染架构和沙盒机制）。因此需要使用微信提供的组件和api来实现，本文介绍使用[Taro](https://docs.taro.zone/docs/)总的说来还是比较简单的。
## 组件的选用
Taro提供了四种经过封装的视图组件：[CoverView](https://docs.taro.zone/docs/components/viewContainer/cover-view), [MovableView](https://docs.taro.zone/docs/components/viewContainer/movable-view), [ScrollView](https://docs.taro.zone/docs/components/viewContainer/scroll-view), [View](https://docs.taro.zone/docs/components/viewContainer/view)。因为要做的是上拉下拉的检测，查看官方文档，发现`ScrollView`中的`onRefresherRefresh`和`onScrollToLower`属性支持下拉和上拉事件回调的自定义，因此选用该组件实现功能
## 实现
虽然`ScrollView`组件名字带个Scroll，但是它其实是默认设置不允许横向纵向滚动的，因此首先需要设置`scrollY`属性为`true`。
```JSX
<ScrollView
	scrollY
>
	{/* ... */}
</ScrollView>
```
> 这里有一个坑就是`onScrollToLower`属性在右滑的时候也会触发，所以一定不能设置`scrollX`为`true`！

使用自定义下拉刷新需要设置`refresherEnabled`为`true`，因此也要在代码中传递该`props`。
```JSX
<ScrollView
	scrollY
	refresherEnabled
>
	{/* ... */}
</ScrollView>
```
然后添加`onRefresherRefresh`属性，当下拉的时候，自定义刷新事件便会触发
```JSX
<ScrollView
	scrollY
	refresherEnabled
	onRefresherRefresh={this.handleRefresherRefresh}
>
	{/* ... */}
</ScrollView>
```
上拉加载更为简单，直接添加`onScrollToLower`属性即可
```JSX
<ScrollView
	scrollY
	refresherEnabled
	onRefresherRefresh={this.handleRefresherRefresh}
	onScrollToLower={this.handleLoadMore}
>
	{/* ... */}
</ScrollView>
```
如果想实现离底部一定距离就触发上拉的回调函数，可以添加`lowerThreshold`属性，值为距离底部/右边的距离（单位px）。

如果不方便使用`onScrollToLower`事件，可以使用`Taro UI`中的[LoadMore](https://taro-ui.jd.com/#/docs/loadmore)组件替代，自定义程度更高，相对的实现难度也会更高。