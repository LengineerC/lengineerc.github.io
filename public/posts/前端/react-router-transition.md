---
title: 'React添加路由切换过渡动画'
author: 'LengineerC'
time: '2025-04-28 13:26:58'
abstract: '本网站初版加载动画解决方案'
lock: false
password: ''
top: false
tags: 
  - 前端
  - React
---

# 使用场景
在使用`React router dom`进行路由切换的时候，视图会直接切换，导致观感过于生硬，由此可以添加过渡动画，使过渡更加平滑。以下是两种可能的实现方案以供参考
## 组件懒加载+`Suspense`
`React`组件在被挂载可视前会执行一系列生命周期函数，如果待加载的组件被`Suspense`组件包裹，那组件在加载完毕前会被`Suspense`中设置的组件替代显示。
```jsx
<Suspense fallback={<Loading/>}>
  <MyComponent />
</Suspense>
```
这段代码实现的效果就是`MyComponent`组件在加载的时候会显示`Loading`的内容。

因此可以使用懒加载路由组件并用`Suspense`包裹所有路由组件的方法实现一个简单的过渡动画: 
```JSX
// 路由配置文件
const Home=lazy(()=>import("../pages/Home/index.tsx"));

const routes=[
    {
        path:"/",
        element:<Home />
    }
]

// 路由挂载的组件
export default function Main() {
  const elements=useRoutes(routes);
  return (
    <main>
      <Suspense fallback={<Loading/>}>
        {elements}
      </Suspense>
    </main>
  )
}
```
使用`ECharts`实现的一个简单`Loading`做测试
```JSX
export default function Loading() {
  const loadingRef=useRef(null);

  useEffect(()=>{
    let loading=echarts.init(loadingRef.current);
    const option:EChartsOption = {
      graphic: {
        elements: [
          {
            type: 'group',
            left: 'center',
            top: 'center',
            children: new Array(7).fill(0).map((val, i) => ({
              type: 'rect',
              x: i * 20,
              shape: {
                x: 0,
                y: -40,
                width: 10,
                height: 80
              },
              style: {
                fill: '#ffffff'
              },
              keyframeAnimation: {
                duration: 1000,
                delay: i * 200,
                loop: true,
                keyframes: [
                  {
                    percent: 0.5,
                    scaleY: 0.3,
                    easing: 'cubicIn'
                  },
                  {
                    percent: 1,
                    scaleY: 1,
                    easing: 'cubicOut'
                  }
                ]
              }
            }))
          }
        ]
      }
    };
    loading.setOption(option);
  },[])
  return (
    <div ref={loadingRef} className={'loading-main'} />
  );
}
```
现在在路由页面切换时，这个`Loading`组件会显示，当组件加载完成时，`Loading`组件也会被正常卸载。

但美中不足的一点就是`Loading`这个组件本身也会没有过渡地突然出现和消失。我之前想过使用`React`的生命周期函数来动态控制CSS（添加复合类的形式），类似：
```SCSS
.loading{
    // 其他样式...
    transition: 0.3s;

    &.fade-in{
        opacity: 1;
        // 其他样式...
    }

    &.fade-out{
        opacity: 0;
        // 其他样式... 
    }
}
```
然后在`componentDidMount`时添加`fade-in`，在`componentWillUnMount`的时候添加`fade-out`实现`Loading`组件本身的过渡效果，后面测试时发现这种方法并不可行，经过搜索和自己测试，最终采取了下面的方式解决。
## 使用`react-transition-group`库
[react-transition-group]([react-transition-group - npm](https://www.npmjs.com/package/react-transition-group))是管理组件的挂载和卸载，并提供生命周期钩子来应用CSS动画或JavaScript动画的库，使用其可以实现比较完美的过渡动画
### 安装
```shell
npm install react-transition-group --save
```
### 使用
创建两个state用于管理动画状态
```TSX
const [isLoading, setIsLoading] = useState(false);
const [showLoading, setShowLoading] = useState(false);
```
再监测路由跳转，当路由变化时设置显示`Loading`组件并开始动画
```TSX
useEffect(() => {
    setIsLoading(true);
    setShowLoading(true);
    loadingStartTime.current = Date.now();
}, [location.key]);
```
在所有路由组件的最外层使用`CSSTransition`包裹
```TSX
<main>
  <TransitionGroup>
    {showLoading && (
      <CSSTransition
        in={isLoading}
        timeout={500}
        classNames="loading-transition"
        unmountOnExit
      >
        <Loading />
      </CSSTransition>
    )}
    
    <CSSTransition
      key={location.key}
      timeout={500}
      classNames="page-transition"
    >
      <Suspense
        fallback={
          <span style={{ display: 'none' }} />
        }
      >
        {elements}
      </Suspense>
    </CSSTransition>
  </TransitionGroup>
</main>
```
并按`-enter, -exit`的CSS选择器名抽后缀设置CSS过渡效果`-active`则为状态激活后的动画效果
```css
.loading-transition-enter {
    opacity: 0;
}
  
.loading-transition-enter-active {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
}

.loading-transition-exit {
    opacity: 1;
}
  
.loading-transition-exit-active {
    opacity: 0

    transition: opacity 150ms ease-in-out;
}
  
.page-transition-enter {
    opacity: 0;
}
  
.page-transition-enter-active {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
}
  
.page-transition-exit {
    opacity: 1;
}
  
.page-transition-exit-active {
    opacity: 0;
    transition: opacity 150ms ease-in-out;
}
```
现在已经能实现`Loading`组件的平滑进入效果，但是有一个新的问题就是状态不会退出，一直卡在`Loading`的动画中，我们只设置了`isLoading`和`showLoading`为`true`并没有在组件加载完成之后设置回`false`，因此要想办法在组件加载完成时还原状态。使用`Redux`或给每个路由组件传递一个回调控制父组件的`isLoading`和`showLoading`状态有点过于复杂，且不符合开闭原则。

所以我们可以创建一个组件用于跟踪路由组件的加载状态，给这个跟踪组件传递回调用于改变父组件加载相关`state`为`false`。
```TSX
type Props={
  onFinish:()=>void
}

function LoadingTracker({ onFinish }:Props) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      return;
    }
  
    onFinish();
  }, [isMounted, onFinish]);
  
  return null;
}
```
把这个组件放到`Suspense`标签内
```JSX
<Suspense
    fallback={
      <span style={{ display: 'none' }} />
    }
>
    <LoadingTracker onFinish={handleLoadingFinish} />
    {elements}
</Suspense>
```
添加`handleLoadingFinish`函数
```javascript
const handleLoadingFinish = () => {
// 最短加载时间，防止加载时间过短导致闪屏
const minimumLoadingTime = 700;
const elapsed = Date.now() - loadingStartTime.current;
const remaining = Math.max(minimumLoadingTime - elapsed, 0);

setTimeout(() => {
      setIsLoading(false);
      setShowLoading(false);
    }, remaining);
};
```
这段代码执行的逻辑是
1. `LoadingTracker`组件被创建，同时初始化`isMounted`为`false`，然后触发`useEffect`设置`isMounted`为`true`
2. `Suspense`加载新的路由组件（`element`）
3. 路由组件加载完成后，`Suspense`重新渲染更新子组件（`LoadingTracker`和路由组件）
4. `LoadingTracker`触发`useEffect`，执行`onFinish`回调，执行父组件的`handleLoadingFinish`
5. 加载完毕

至此就完全实现了路由切换的加载过渡。