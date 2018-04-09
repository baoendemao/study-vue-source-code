#### vue怎么更新真实的dom树
* 当监听到component的data变化之后，更新vdom，然后diff vdom和真实的dom, 将变化的部分抽取出来，更新真实的dom
#### vNode数据结构 [源码点这里](https://github.com/vuejs/vue/blob/dev/src/core/vdom/vnode.js)
```
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;      // vNode的文本
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;     // 是否是clone的vNode
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
```



#### 服务器渲染，server bundle和client bundle的对比
* 一直很好奇webpack打包之后的server bundle和client bundle是如何对比的?