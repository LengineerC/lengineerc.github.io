---
title: 'Rust仿node事件总线的简单实现'
author: 'LengineerC'
time: '2025-11-25 16:25:17'
abstract: '前端开发学习rust中不得不品的一环....'
lock: false
password: ''
top: false
tags:
  - rust
  - 事件总线
---

用过node的人都知道，事件驱动是node的核心运行机制。在异步编程中我们可以给一个事件绑定一个回调，当任务执行完成后emit一个事件触发回调。node中，官方提供了`EventEmitter`的给用户做自定义事件处理：
```js
const EventEmitter = require("events");

const emitter = new EventEmitter();
emitter.on('xxx', callback);
emitter.emit('xxx');
```

而在Rust中，官方库并没有提供这样一个功能。作为一个习惯了写js的人来说，事件驱动编程是很爽的，一些场景下不用刻意去处理代码的执行逻辑顺序。所以就仿造node自己实现一个简单的rust事件总线来满足基本需求，同时使用[tokio](https://tokio.rs/)来实现异步处理。

## 需求分析
rust和js不同，js是单线程的，而rust有多线程，所以在写的时候需要考虑数据竞态、死锁等线程安全问题。

考虑到js的弱类型和动态特性，回调函数的定义可以很轻松，而rust是静态强类型，而且有宇宙第一的编译器，光是在类型定义这一步就很难，因此只能给变量做一个类型擦除。（不用泛型是因为泛型会限制参数和函数的类型范围，虽然写起来会更简单，但是在实际场景中只能定义多种emitter来适配不同的使用需求，变得极度不灵活）

## 实现

### 单线程
先从单线程的回调参数开始设计，因为涉及任意类型参数，所以可以直接用最简单的类型擦除实现单个参数的类型
```rust
type Arg = Box<dyn Any>;
```
实现类似js函数参数中的`...args`只需要使用`Vec`就行，没用数组切片是为了避免考虑生命周期的问题，同时为了便于调用，可以使用`Rc`来实现多所有权
```rust
type Args=Rc<Vec<Arg>>;
```
js中可以一个事件对应多个回调并且还有对回调的增删操作，所以后续可以用一个`HashMap`来存储一个事件和其对应的回调函数。为了适配这个功能，需要封装一个对象用来存储单个回调函数本体和其标识符，暂且就命名为`Handler`，不过在此之前还要先考虑回调函数本身的类型怎么定义。因为在使用过程中回调函数为一个闭包，而不同的回调可能形式不同，所以可以使用
```rust
type SyncCallback = Rc<dyn Fn(Args)>; // 同步回调
type AsyncCallback = Rc<dyn Fn(Args) -> Pin<Box<dyn Future<Output = ()>>>>; // 异步回调
```
来兼容不同类型的闭包。使用枚举包裹回调函数则可以在一种`Emitter`中处理两种回调

```rust
enum Callback {
    Sync(SyncCallback),
    Async(AsyncCallback),
}
```
然后我们就可以编写`Handler`对象了

```rust
type HandlerId = u64;

struct Handler {
    pub id: HandlerId,
    pub callback: Callback,
    pub once: bool, // 是否单次触发
}
```
之后就可以开始考虑`Emitter`本体了。（最开始考虑使用泛型在一种`Emitter`中处理单/多线程，后面发现实现过于困难，于是拆解为两种实现，**有大佬知道解决方案的请给我留言学习一下**）

首先肯定要有个变量来存储事件监听器的信息，还是老套路，使用`Rc`, `RefCell`实现单线程的内部可变多所有权，`Handler`中还有`id`，因此需要一个计数器实现自动递增
```rust
struct SingleThreadEventEmitter {
    listeners: Rc<RefCell<HashMap<String, Vec<Handler>>>>,
    id_counter: Rc<RefCell<HandlerId>>,
}

impl SingleThreadEventEmitter {
    pub fn new() -> Self {
        Self {
            listeners: Rc::new(RefCell::new(HashMap::new())),
            id_counter: Rc::new(RefCell::new(1)),
        }
    }

    fn get_id(&self) -> HandlerId {
        let mut id = self.id_counter.borrow_mut();
        let old_value = *id;
        *id += 1;
        old_value
    }
}
```
接下来先考虑处理同步回调涉及的方法（因为最开始想把单线程多线程写在一起，所以直接写成了`trait`，后面推翻了这个想法导致`trait`稍微有点多此一举），本项目只是个简单实现，所以只实现回调的增删和触发即可

```rust
trait EventEmitter {
    // 添加事件及其回调（回调函数可以多次添加）
    fn on<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) + 'static;

    // 同node的once
    fn once<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) + 'static;

    // 删除单个回调
    fn off(&self, event: &str, id: HandlerId) -> bool;

    // 删除整个事件
    fn off_all(&self, event: &str);

    // 触发事件
    fn emit(&self, event: &str, args: Rc<Vec<Arg>>);
}
```
这里添加`'static`的原因是这个闭包存进`Handler`的`callback`里面，而回调在没有主动删除的情况下应该一直存在，所以标记为静态生命周期告诉编译器该闭包全程有效。

先看最简单的`on`的实现
```rust
fn on<F>(&self, event: &str, callback: F) -> HandlerId
where
    F: Fn(Args) + 'static,
{
    let id = self.get_id();
    let handler = Handler {
        id,
        callback: Callback::Sync(Rc::new(callback)),
        once: false,
    };

    self.listeners
        .borrow_mut()
        .entry(event.to_string())
        .or_default()
        .push(handler);

    id
}
```
代码还是比较简单的这里就不在赘述，`once`的实现和`on`的唯一区别就是构造`Handler`的时候把`once`字段变为`true`

接下来看看`off`的实现
```rust
fn off(&self, event: &str, id: HandlerId) -> bool {
    let mut listeners = self.listeners.borrow_mut();

    if let Some(handlers) = listeners.get_mut(event) {
        let len = handlers.len();
        handlers.retain(|h| h.id != id);

        return len != handlers.len();
    }

    false
}
```
就是一个简单的根据`HandlerId`删除对应`Handler`

`off_all`就是直接从`HashMap`中删除整个事件
```rust
fn off_all(&self, event: &str) {
    self.listeners.borrow_mut().remove(event);
}
```

这里先暂时不讲`emit`实现，前面提到过单个`Emitter`中同时处理了同步和异步闭包，还要为异步回调创建单独的`on`/`once`方法
```rust
trait AsyncEventEmitter {
    fn on_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) -> Pin<Box<dyn Future<Output = ()>>> + 'static;

    fn once_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) -> Pin<Box<dyn Future<Output = ()>>> + 'static;
}

impl AsyncEventEmitter for SingleThreadEventEmitter {
    fn on_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) -> Pin<Box<dyn Future<Output = ()>>> + 'static,
    {
        let id = self.get_id();
        let handler = Handler {
            id,
            callback: Callback::Async(Rc::new(callback)),
            once: false,
        };

        self.listeners
            .borrow_mut()
            .entry(event.to_string())
            .or_default()
            .push(handler);

        id
    }

    fn once_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(Args) -> Pin<Box<dyn Future<Output = ()>>> + 'static,
    {
        let id = self.get_id();
        let handler = Handler {
            id,
            callback: Callback::Async(Rc::new(callback)),
            once: true,
        };

        self.listeners
            .borrow_mut()
            .entry(event.to_string())
            .or_default()
            .push(handler);

        id
    }
}
```
异步版`on`/`once`和同步版的唯一区别就是异步创建`Callback`时使用的是`Async`，同步为`Sync`。

现在来处理`emit`了，逻辑也不算太复杂，这里先贴上具体实现
```rust
fn emit(&self, event: &str, args: Rc<Vec<Arg>>) {
    let callbacks: Vec<Callback> = self
        .listeners
        .borrow()
        .get(event)
        .map(|handlers| handlers.iter().map(|h| h.callback.clone()).collect())
        .unwrap_or_default();

    for callback in callbacks {
        match callback {
            Callback::Sync(cb) => {
                cb(args.clone());
            }
            Callback::Async(cb) => {
                let args_clone = args.clone();
                tokio::task::spawn_local(async move {
                    cb(args_clone).await;
                });
            }
        }
    }

    // 清除单次执行的Handler
    let mut listeners = self.listeners.borrow_mut();
    let handlers_opt = listeners.get_mut(event);
    if let Some(handlers) = handlers_opt {
        handlers.retain(|h| !h.once);
    }
}
```
这里面有一个需要注意的点就是在之前的参数定义中，没有实现`Send`，并且也是使用的`Rc`非线程安全型，而在`tokio`中`spawn`是多线程调度，我们的参数不能在线程间安全传递，所以使用的是`spawn_local`，缺点就是调用的时候会有一点复杂。

#### 使用
##### 同步
如果不涉及异步，那调用相当简单
```rust
fn test() {
    let emitter = SingleThreadEventEmitter::new();

    let id1 = emitter.on("test", |_| { ... });
    let id2 = emitter.once("test", move |args| {
        if let Some(arg) = args[0].downcast_ref::<i32>() {
            // 参数处理逻辑
        }
    });
    let id3 = emitter.on("test", |_| { ... });

    emitter.emit("test", Rc::new(vec![Box::new(42) as Arg]));
    emitter.emit("test", Rc::new(vec![]));
}
```
直接结果和我们要求的一样，参数能正确获取，并且事件第二次触发的时候`id2`对应的`Handler`已经被删除不会触发。唯一的缺点还是参数的使用有点麻烦，这里给出一些解决方式：
1. `emit`时参数必须要类型断言且套`Rc`和`Vec`

    我们可以写一个简单的声明宏来自动生成参数代码模板
    ```rust
    #[macro_export]
    macro_rules! args {
        ($($v:expr),* $(,)?) => {
            std::rc::Rc::new(vec![$(Box::new($v) as Box<dyn std::any::Any>),*])
        };
    }
    ```
2. 闭包中使用参数要经过复杂的类型向下转换(downcast)

    可以自己封装一个函数来处理

##### 异步
由于`Emitter`中异步设计和`spawn_local`的局限性，在单线程中使用异步会稍微有点复杂（在多线程版本中会好很多）,下面给出一个测试时候使用的用例
```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let local = LocalSet::new();

    local
        .run_until(async {
            let emitter = SingleThreadEventEmitter::new();

            emitter.on("e1", |_| {
                println!("Emitted e1");
            });

            emitter.once("e1", |args| {
                let n: i32 = *args[0].downcast_ref().unwrap();
                println!("{}", n);
                println!("Emitted e1 2");
            });

            emitter.on_async("e1", |args| {
                // 必须这样写
                Box::pin(async move {
                    let n = *args[0].downcast_ref::<i32>().unwrap();
                    let res = async_test(n).await;
                    println!("{}", res);
                })
            });

            println!("Emitting e1 first time");
            emitter.emit("e1", args![1]);

            println!("Emitting e1 second time");
            emitter.emit("e1", args![1]);

            tokio::task::yield_now().await;
        })
        .await;
}
```
因为我们的单线程回调是`!Send`任务，使用`flavor = "current_thread"`保证我们的任务在单线程上面运行，同时要结合`LocalSet`进行本地任务调度。

关于必须写
```rust
Box::pin(async move { ... })
```
本人技术不精，也没找到什么好的办法（向大佬求助）。

### 多线程
有了单线程的代码结构，我们很容易在此基础上改造出一个多线程版本出来。

因为闭包参数会在多个线程中转递，所以要实现基本的`Send`和`Sync`
```rust
type ThreadSafeArg = Box<dyn Any + Send + Sync>;
```
其余对应的参数组，回调类型之类的只需要把`Rc`换为`Arc`，同时添加`Send`和`Sync`即可
```rust
type ThreadSafeArgs=Arc<Vec<ThreadSafeArg>>;
type SyncThreadSafeCallback = Arc<dyn Fn(ThreadSafeArgs) + Send + Sync>;
type AsyncThreadSafeCallback =
    Arc<dyn Fn(ThreadSafeArgs) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync>;
```
在`AsyncThreadSafeCallback`中由于`Future`不可能被多个函数同时轮询（在某一个线程中独占执行）所以只用实现`Send`

`Emitter`本体设计上和单线程版本有些区别，需要手动传入运行时，具体原因后面再说
```rust
struct MultiThreadEventEmitter {
    listeners: Arc<Mutex<HashMap<String, Vec<ThreadSafeHandler>>>>,
    id_counter: Arc<AtomicU64>,
    handle: Option<tokio::runtime::Handle>,
}

impl MultiThreadEventEmitter {
    pub fn new() -> Self {
        Self {
            listeners: Arc::new(Mutex::new(HashMap::new())),
            id_counter: Arc::new(AtomicU64::new(0)),
            handle: None,
        }
    }

    pub fn set_handle(mut self, handle: tokio::runtime::Handle) -> Self {
        self.handle = Some(handle);
        self
    }

    fn get_id(&self) -> HandlerId {
        self.id_counter.fetch_add(1, Ordering::SeqCst)
    }
}
```
对应的接口方法定义
```rust
trait ThreadSafeEventEmitter: Send + Sync {
    fn on<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(ThreadSafeArgs) + Send + Sync + 'static;

    fn once<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(ThreadSafeArgs) + Send + Sync + 'static;

    fn off(&self, event: &str, id: HandlerId) -> bool;

    fn off_all(&self, event: &str);

    fn emit(&self, event: &str, args: Arc<Vec<ThreadSafeArg>>);
}

trait ThreadSafeAsyncEventEmitter {
    fn on_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(ThreadSafeArgs) -> Pin<Box<dyn Future<Output = ()> + Send>>
            + Send
            + Sync
            + 'static;

    fn once_async<F>(&self, event: &str, callback: F) -> HandlerId
    where
        F: Fn(ThreadSafeArgs) -> Pin<Box<dyn Future<Output = ()> + Send>>
            + Send
            + Sync
            + 'static;
}
```
类型定义和大部分实现上和单线程版本没有太大差别，只是多实现了`Send`和`Sync`，然后把`Rc`换为`Arc`，`RefCell`换为`Mutex`，然后多了一些并发锁的处理。具体实现：[multi_thread.rs](https://github.com/LengineerC/eventemitter-rs/blob/main/src/event_emitters/multi_thread.rs)

回到需要传入运行时的问题，在多线程的`emit`中，一样采用了同步异步的混合处理，但是可以发现并没有采用`tokio::spawn`的方式执行异步任务，因为`tokio::spawn`只能在当前上下文中执行，`emit`函数本身不是`async`的，而且整个`MultiThreadEventEmitter`也不是`async`块本身。所以为了保留上下文，最好的办法就是调用时直接传递上下文。

#### 使用
##### 同步
和单线程没有任何区别，也要参数类型断言和向下转换，也可以写一个宏来处理参数类型断言的问题
```rust
#[macro_export]
macro_rules! ts_args {
    ($($v:expr),* $(,)?) => {
        std::sync::Arc::new(vec![$(Box::new($v) as Box<dyn std::any::Any + Send + Sync>),*])
    };
}
```

##### 异步
同样展示一个测试是的用例
```rust
#[tokio::main]
fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let emitter = MultiThreadEventEmitter::new()
        .set_handle(rt.handle().clone());
    emitter.on("e1", |_| {
        println!("e1 1");
    });

    emitter.on("e1", |args| {
        let n: i32 = *args[0].downcast_ref().unwrap();
        println!("{}", n);
    });

    emitter.on_async("e1", |args| {
        let n: i32 = *args[1].downcast_ref().unwrap();
        Box::pin(async move {
            let res = async_test(n).await;
            println!("async: {}", res);
        })
    });

    emitter.once_async("e1", |args| {
        let n: i32 = *args[0].downcast_ref().unwrap();
        Box::pin(async move {
            let res = async_test(n).await;
            println!("async once: {}", res);
        })
    });

    emitter.emit("e1", ts_args![1, 2]);

    let h = thread::spawn(move || {
        emitter.emit("e1", ts_args![1, 2]);
    });

    h.join().unwrap();
}
```
除了没有单线程的`flavor = "current_thread"`和`LocalSet`，调用方法和单线程并无区别。

## 总结
这个事件总线的实现了最基本的订阅发布功能，异步处理上还是存在一些未解决的问题。本文只是作为一种实现思路，在细节部分上没有做到完美（~~当然和实力有关~~）。**作为一个初学者欢迎大家批评指正，有好的思路也欢迎大家指导。**