文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

--

#### 什么是vDom
* virtual dom => vDom
  * html结构可以抽象成一棵dom树，vdom亦是如此，而vnode就是树上挂着的各个节点的抽象数据结构，使用js对象来表示。
  * 当数据发生变化的时候，首先修改js dom对象，而不是直接去修改真实的dom。即“数据的变化”来驱动“视图的变化”。

#### VNode构造函数
```
var VNode = function VNode (tag, data, children, text, elm, context, componentOptions, asyncFactory) {
  this.tag = tag;             // 标签名，如div
  this.data = data;           // 节点对象，包含节点相关的属性，如on属性对应click事件函数, staticClass对应class的值
  this.children = children;   // 孩子节点数组，VNode数组。 注意：组件VNode的children是undefined
  this.text = text;           // 文本节点，可以用来判断是否是文本节点
  this.elm = elm;             // 真实的dom。其中组件VNode的elm是undefined
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;  // v-for的时候写的:key
  this.componentOptions = componentOptions;   // 组件的componentOptions包含了Ctor, propsData, listeners, tag, children
  this.componentInstance = undefined;  // 此变量如果存在，则是组件VNode
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;   // 是否是静态节点，用来optimize diff的过程
  this.isRootInsert = true;
  this.isComment = false;  // 是否是注释节点
  this.isCloned = false;  // 是否是clone的VNode节点
  this.isOnce = false;    // 节点中是否有v-once
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
}

```

#### 创建virtual dom
在Vue.prototype.$mount()中模板字符串template转换成render function后，需要初始化vm.$el, 创建virtual dom，入口函数是mountComponent()

* mountComponent() => 挂载el => 初始化vm.$el, new Watcher(), 创建virtual dom => 调用生命周期钩子beforeMount，mounted <br/>

```
function mountComponent (vm, el, hydrating) {

  vm.$el = el;
  
  if (!vm.$options.render) {   // 外面没有传入render函数，如果也没有办法由template生成render function，会报出警告

    // render函数将会生成一个空的VNode
    vm.$options.render = createEmptyVNode;   

    {
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') || vm.$options.el || el) {
        // template写了，但是template不是以#开头的，或者
        // template没有写，外面传入只写了el，或者
        // 都没有写，只传入了el
        // 以上三种情况，在runtime-only的Vue版本中，template不会编译成render函数，所以报出警告
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        // template没有写， el也没有写，render函数也没写，所以报出警告
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  } 

  // 调用beforeMount生命周期钩子: 模板compile成render function之后，创建watcher之前。
  // 服务器端渲染不会被调用
  callHook(vm, 'beforeMount');  

  var updateComponent;  // 函数

  if (process.env.NODE_ENV !=='production' && config.performance && mark) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render();  // 调用Vue.prototype._render()创建vnode
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating);
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    
    // 渲染成真实的dom
    updateComponent = function () {

      // 参数一：vm._render()生成一个VNode， vm._render()会读取属性，从而触发属性的get拦截器，进行依赖收集
      // 参数二：当在浏览器端运行时，服务器端渲染表示hydrating为false
      // vm._update将生成的VNode渲染成真实的dom
      vm._update(vm._render(), hydrating);

    };
  }
 
  // new render wathcer，即渲染watcher
  // updateComponent作为该watcher实例的属性getter
  // 两次：首次渲染，数据变化的时候
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */);
  hydrating = false;

 
  if (vm.$vnode == null) {    // vm.$vnode表示的是父的vnode, null表明是根节点

    vm._isMounted = true;     // 声明周期走到mounted的标志，表明已完成挂载el
    callHook(vm, 'mounted');  // 生成dom树之后

  }

  return vm 
}  

```

* Vue.prototype._render() => 生成VNode

```
Vue.prototype._render = function () {

    // _render函数会访问到代理到vm上的data数据，就被响应式的get方法监听到
    var vm = this;

    var ref = vm.$options;
    var render = ref.render;   // 由模板template生成的render function

    var _parentVnode = ref._parentVnode;

    // reset _rendered flag on slots for duplicate slot check
    {
      for (var key in vm.$slots) {
        // $flow-disable-line
        vm.$slots[key]._rendered = false;
      }
    }

    if (_parentVnode) {
      vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject;
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !=='production' && Array.isArray(vnode)) {

        // 如果生成的vnode是一个数组，则会报出警告，root根节点只允许有一个
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };

```

* vm.$createElement() => 创建VNode

```
vm.$createElement = function (a, b, c, d) { 

    return createElement(vm, a, b, c, d, true); 

};
```

* initProxy() =>在Vue.prototype._init中调用的initProxy(), 该函数是全局定义的 => 初始化vm._renderProxy => Proxy代理对象 
```

var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
);

var warnNonPresent = function (target, key) {

    // 使用了一个没有定义的属性, 报出警告
    // 例如：在模板中使用了某个属性，但在data里没有定义该属性
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
};


var initProxy;

// 判断宿主环境是否支持Proxy
var hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy);  // 检查浏览器是否支持es6的proxy

if (hasProxy) {
  var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
  config.keyCodes = new Proxy(config.keyCodes, {
    set: function set (target, key, value) {

      if (isBuiltInModifier(key)) {
        warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
        return false
      } else {
        target[key] = value;
        return true
      }
    }
  });
}

var hasHandler = {
  has: function has (target, key) {

    var has = key in target;
    var isAllowed = allowedGlobals(key) || key.charAt(0) === '_';

    if (!has && !isAllowed) {
      // 报出warning
      warnNonPresent(target, key);
    }

    return has || !isAllowed
  }
};

var getHandler = {
  get: function get (target, key) {

    if (typeof key === 'string' && !(key in target)) {
      // 报出warning 
      warnNonPresent(target, key);
    }

    return target[key]
  }
};

initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;

      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;

      // 初始化vm的代理，赋值给vm._renderProxy
      // 以后再访问vm的属性，就会被vm._renderProxy代理拦截，调用getHandler
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
```

* createEmptyVNode() => Vue.prototype._e => vm._e

```
// 创建空的VNode节点
var createEmptyVNode = function (text) {

  if ( text === void 0 ) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;  

  return node
};

```

* createTextVNode() => Vue.prototype._v => vm._v

```
// 创建文本节点VNode， new VNode()的第4个参数是文本值
function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

```

* cloneVNode() => 用于static节点和slot节点 => 渲染时候使用新的clone节点，来防止dom渲染使用相同的真实的dom引用导致的错误

```
// 克隆VNode
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.isCloned = true;
  return cloned
}
```
* sameVnode() => 判断两个VNode是否相似 => key相同，且类型相同 => 用于新旧节点比较diff，用来optimize优化的过程
```
function sameVnode (a, b) {

  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}

```
* createElement() => 创建VNode对象（ 具体的VNode对象里的属性见VNode构造函数 ）

```
function createElement (context, tag, data, children, normalizationType, alwaysNormalize) {
 
  if (Array.isArray(data) || isPrimitive(data)) {      // isPrimitive()：是否是基本数据类型
    normalizationType = children;
    children = data;
    data = undefined;
  }

  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }

  // 返回创建的VNode
  return _createElement(context, tag, data, children, normalizationType);  
}

```
<br/>
这里创建的VNode结构是怎样的？<br/>
举个例子：假如html结构如下所示，其中#app作为Vue实例的挂载点<br/>

```
<div id="app">
    <div v-if="name" class="name-node">{{name}}</div>
    <div class="count-node">{{count}}</div>
    <div @click="addCount()" class="click-node">click here</div>
    <div v-for="i in ['o', 'p', 'q', 'r', 's', 't']" class="i-node">{{i}}</div>
    <div class="obj-data-node">{{objData.u}}</div>
</div>

```

<br/>
div#app将会被create成一个new VNode()对象，如下所示</br>

```
asyncFactory: undefined
asyncMeta: undefined
children: (14) [VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode, VNode]
componentInstance: undefined
componentOptions: undefined
context: Vue {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …}
data: {attrs: {…}}
elm: div#app   => 真实的dom元素
fnContext: undefined
fnOptions: undefined
fnScopeId: undefined
isAsyncPlaceholder: false
isCloned: false
isComment: false  => 是否是注释节点
isOnce: false
isRootInsert: true
isStatic: false
key: undefined
ns: undefined
parent: undefined
raw: false
tag: "div"   => 元素标签
text: undefined
child: (...)
```
这里重点讲解VNode数据结构中的children属性。根据例子来看，children是div#app虚拟节点所包含的14个VNode元素的数组。为什么这里是14个？<br/>
首先v-for是6个VNode， div.name-node是1个VNode，div.count-node是1个VNode，div.click-node是1个VNode， div.obj-data-node是1个VNode， 其余4个VNode是指的div与div之间的换行表示的文本节点(如果把换行去掉，这4个VNode将不会产生)
<br/>

* _createElement() => 创建VNode

```
var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2; 

function _createElement (context, tag, data, children, normalizationType) {

  if (isDef(data) && isDef((data).__ob__)) {
    process.env.NODE_ENV !=='production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }

  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }

  // warn against non-primitive key
  if (process.env.NODE_ENV !=='production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) && typeof children[0] === 'function') {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }

  // children是一个数组，每个元素都是一个VNode
  // 两种不同的normalize children数组的方法，结果都是将children变成一维数组
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);        // 递归的处理所有的数组的情况，扁平化
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);   // 只处理到children的一维是数组的情况，扁平化
  }
  var vnode, ns;

  // vnode的属性tag如果是字符串，则判断 : (1)tag如果是保留字，则直接创建VNode  (2)tag如果不是保留字，如果含有components字段，则创建Component VNode
  // tag如果不是字符串，则直接创建Component VNode
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);

    
    if (config.isReservedTag(tag)) {
      // platform built-in elements
     
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );

    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      // 创建组件VNode
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {

      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    // 创建组件VNode
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
} 
```

```
function resolveAsset (options, type, id, warnMissing) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }

  var assets = options[type];

  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }

  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }

  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }

  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];

  if (process.env.NODE_ENV !=='production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

```

* applyNS()
```
function applyNS (vnode, ns, force) {

  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force);
      }
    }
  }
}
```

* getTagNamespace()

```
function getTagNamespace (tag) {

    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
}
```

* normalizeChildren()
```
function normalizeChildren (children) {

  return isPrimitive(children)     // isPrimitive()：是否是基本数据类型
    ? [createTextVNode(children)]  // 如果是基本数据类型，直接创建文本vnode 
    : Array.isArray(children)      // 如果children是一个数组
      ? normalizeArrayChildren(children)
      : undefined
}
```

* isTextNode()

```
function isTextNode (node) {

  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}
```

* normalizeArrayChildren()

```
function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') { continue }
    lastIndex = res.length - 1;
    last = res[lastIndex];

    if (Array.isArray(c)) {
      // 递归处理所有是数组的情况，扁平化，都放到res中，最后返回

      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {     // isPrimitive()：是否是基本数据类型
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

```

* simpleNormalizeChildren()

```
function simpleNormalizeChildren (children) {

  for (var i = 0; i < children.length; i++) {
    // 如果children数组的某个元素也是数组，则直接连接到children, 组成一维数组, 直接返回
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children);
    }
  }
  return children;
}

例如：
var a = [
	[1, 2, 3], [3, 4, 5]
];
Array.prototype.concat.apply([], a);   // [1, 2, 3, 3, 4, 5]
```

* registerDeepBindings()
```
function registerDeepBindings (data) {

  if (isObject(data.style)) {
    traverse(data.style);
  } 

  if (isObject(data.class)) {
    traverse(data.class);
  } 

}
```

*  Vue.prototype._update() => 调用生命周期钩子beforeUpdate => 重点是调用vm.__patch__
```
  Vue.prototype._update = function (vnode, hydrating) {

    var vm = this;

    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;   
    var prevVnode = vm._vnode;   // vm._render()返回的vnode

    var prevActiveInstance = activeInstance;  // 保存上一次的activeInstance， 将它作为当前vm的父vue实例，即是按照深度优先遍历来初始化的

    activeInstance = vm;
    vm._vnode = vnode;


    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // 首次渲染
      // 第一个参数：传入的是真实的dom

      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );
      // no need for the ref nodes after initial patch
      // this prevents keeping a detached DOM tree in memory (#5851)
      vm.$options._parentElm = vm.$options._refElm = null;
    } else {
      // 数据更新 => mvvm => 渲染更新

      vm.$el = vm.__patch__(prevVnode, vnode);        

    }


    activeInstance = prevActiveInstance;
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }

    // if parent is an HOC, update its $el as well
    // vm.$vnode是指的父vnode，其中根节点的$vnode是undefined
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }

    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };
```

* createFunctionalComponent()
```
function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {

  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options)
  } else if (Array.isArray(vnode)) {
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options);
    }
    return res
  }
}

```
* mergeProps()
```

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}
```

* cloneAndMarkFunctionalResult()
```

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options) {

  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

```

* createPatchFunction() => 返回patch()函数 => 将虚拟dom生成真实的dom(只在浏览器端需要)

```
var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

// 里面声明了很多函数
function createPatchFunction (backend) {

  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  // cbs
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  // 根据elm的标签名创建空的VNode对象
  function emptyNodeAt (elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb (childElm, listeners) {
    function remove () {
      if (--remove.listeners === 0) {
        removeNode(childElm);
      }
    }
    remove.listeners = listeners;
    return remove
  }

  // 真实的dom操作： 删除el
  function removeNode (el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el);
    }
  }

  function isUnknownElement$$1 (vnode, inVPre) {

    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        config.ignoredElements.some(function (ignore) {
          return isRegExp(ignore)
            ? ignore.test(vnode.tag)
            : ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  var creatingElmInVPre = 0;

  // 根据vnode创建真实的dom，并插入到父节点
  function createElm (vnode, insertedVnodeQueue, parentElm, refElm, nested, ownerArray, index) {

    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = ownerArray[index] = cloneVNode(vnode);
    }

    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      {
        if (data && data.pre) {
          creatingElmInVPre++;
        }
        if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }

      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);

      /* istanbul ignore if */
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }

      if (process.env.NODE_ENV !=='production' && data && data.pre) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }

  } // function createElm()结束


  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {

    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;  // 如果vnode是组件vnode
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */, parentElm, refElm);  // i被赋值为init钩子
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {

    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {

    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode;
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  // 真实的dom操作：插入到根元素
  function insert (parent, elm, ref$$1) {

    if (isDef(parent)) {
      if (isDef(ref$$1)) {
        if (ref$$1.parentNode === parent) {
          nodeOps.insertBefore(parent, elm, ref$$1);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren (vnode, children, insertedVnodeQueue) {

    if (Array.isArray(children)) {
      {
        checkDuplicateKeys(children);
      }
      for (var i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
      }
    } else if (isPrimitive(vnode.text)) {     // isPrimitive()：是否是基本数据类型
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
    }
  }

  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode;
    }
    return isDef(vnode.tag)
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode);
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) { i.create(emptyNode, vnode); }
      if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  function setScope (vnode) {

    var i;
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setStyleScope(vnode.elm, i);
    } else {
      var ancestor = vnode;
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setStyleScope(vnode.elm, i);
        }
        ancestor = ancestor.parent;
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setStyleScope(vnode.elm, i);
    }
  }

  function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
    }
  }

  function invokeDestroyHook (vnode) {

    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
      for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  function removeVnodes (parentElm, vnodes, startIdx, endIdx) {

    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node
          removeNode(ch.elm);
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {

    if (isDef(rm) || isDef(vnode.data)) {
      var i;
      var listeners = cbs.remove.length + 1;
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  // 比较新旧children, 递归执行patchVnode
  function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {

    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    {
      checkDuplicateKeys(newCh);
    }

    // 新旧两棵子树分别有两个索引： 开始索引和结束索引
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
          patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
          canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
          patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
          canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {   // 两节点不同
          if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
          idxInOld = isDef(newStartVnode.key)
            ? oldKeyToIdx[newStartVnode.key]
            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
          if (isUndef(idxInOld)) { // New element
            
            // 创建新的dom节点
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);

          } else {
            vnodeToMove = oldCh[idxInOld];
            if (sameVnode(vnodeToMove, newStartVnode)) {
              patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
              oldCh[idxInOld] = undefined;
              canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
            } else {
              // same key but different element. treat as new element
              createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            }
          }
          newStartVnode = newCh[++newStartIdx];
        }
    }
    if (oldStartIdx > oldEndIdx) {
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }

  } // function updateChildren()结束

  function checkDuplicateKeys (children) {

    var seenKeys = {};
    for (var i = 0; i < children.length; i++) {
      var vnode = children[i];
      var key = vnode.key;
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
            vnode.context
          );
        } else {
          seenKeys[key] = true;
        }
      }
    }
  }

  function findIdxInOld (node, oldCh, start, end) {

    for (var i = start; i < end; i++) {
      var c = oldCh[i];
      if (isDef(c) && sameVnode(node, c)) { return i }
    }
  }

  // 如果新旧VNode是sameVnode()，则调用此patchVnode()函数, 来patch children
  // 如果是静态节点即节点的isStatic属性是true，则跳过静态节点的比较，optimize优化
  function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {

    // 如果新旧VNode完全相同，则直接返回
    if (oldVnode === vnode) {
      return
    }

    var elm = vnode.elm = oldVnode.elm;

    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
      } else {
        vnode.isAsyncPlaceholder = true;
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }

    var i;
    var data = vnode.data;
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
      if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }

    if (isUndef(vnode.text)) {   // 新的vnode没有text, 判断即是否是文本节点

      if (isDef(oldCh) && isDef(ch)) {  // 老的有children，新的有children，且不同，则更新children
        if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }

      } else if (isDef(ch)) {   // 老的没有children，新的有children，则添加

        if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);

      } else if (isDef(oldCh)) {   // 老的有children，新的没有children，则删除

        removeVnodes(elm, oldCh, 0, oldCh.length - 1);

      } else if (isDef(oldVnode.text)) {  // 新的老的都没有children，新的没有text，老的有text, 直接将text置空
        nodeOps.setTextContent(elm, '');
      }

    } else if (oldVnode.text !== vnode.text) {  // 如果新旧节点的text不相等，直接更新成新的节点的text
      nodeOps.setTextContent(elm, vnode.text);
    }

    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
  } // function patchVnode()结束

  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var hydrationBailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
    var i;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    inVPre = inVPre || (data && data.pre);
    vnode.elm = elm;

    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true;
      return true
    }
    // assert node match
    {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          // v-html and domProps: innerHTML
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !=='production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('server innerHTML: ', i);
                console.warn('client innerHTML: ', elm.innerHTML);
              }
              return false
            }
          } else {
            // iterate and compare children lists
            var childrenMatch = true;

            // 真实的dom: elm的第一个孩子
            var childNode = elm.firstChild; 

            // 依次遍历vnode的虚拟节点children数组
            for (var i$1 = 0; i$1 < children.length; i$1++) {
              if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                childrenMatch = false;
                break
              }
              childNode = childNode.nextSibling;
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !=='production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
              }
              return false
            }
          }
        }
      }
      if (isDef(data)) {
        var fullInvoke = false;
        for (var key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true;
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class']);
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch (node, vnode, inVPre) {

    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement$$1(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {

      /**
       * 真实的dom操作：nodeType属性表示dom元素的节点类型， 最重要的节点类型是：
       * 元素element	1
       * 属性attr	2
       * 文本text	3
       * 注释comments	8
       * 文档document	9
       */
      return node.nodeType === (vnode.isComment ? 8 : 3);  
    }
  }

  // 新旧两个VNode对比
  // 首次渲染调用的时候，第一个参数是真实的dom
  // 数据更新调用的时候，第一个参数是vnode
  return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {

    // 如果新的vnode不存在，则删除
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    // 如果不存在oldVnode， 则创建新的节点元素， 添加到parentElm
    // 如果存在oldVnode, 则判断oldVnode和vnode是否是相同的节点： 如果是相同的节点则patchVnode
    if (isUndef(oldVnode)) {
        // empty mount (likely as component), create new root element
        isInitialPatch = true;
        createElm(vnode, insertedVnodeQueue, parentElm, refElm);
    } else {
        // 首次渲染的时候，isRealElement是true
        var isRealElement = isDef(oldVnode.nodeType);

        if (!isRealElement && sameVnode(oldVnode, vnode)) {   // 新旧节点相同的情况 => 则patch对比新旧节点

            // patch existing root node
            patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);

        } else {    // 新旧节点不同的情况 => 删除老的，添加新的
          if (isRealElement) {
            // mounting to a real element
            // check if this is server-rendered content and if we can perform
            // a successful hydration.
            if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
              oldVnode.removeAttribute(SSR_ATTR);   // var SSR_ATTR = 'data-server-rendered';
              hydrating = true;    // 是服务器端渲染，则需要混合client bundle和server bundle
            }

            if (isTrue(hydrating)) {
              // 混合client bundle和server bundle, 如果混合成功，则invokeInsertHook
              if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                invokeInsertHook(vnode, insertedVnodeQueue, true);
                return oldVnode
              } else {
                warn(
                  'The client-side rendered virtual DOM tree is not matching ' +
                  'server-rendered content. This is likely caused by incorrect ' +
                  'HTML markup, for example nesting block-level elements inside ' +
                  '<p>, or missing <tbody>. Bailing hydration and performing ' +
                  'full client-side render.'
                );
              }
            }

            // 如果不是服务器端渲染，或者服务器端渲染但是混合失败了，则创建一个新的空VNode来替代真实的dom
            oldVnode = emptyNodeAt(oldVnode);
          }

          // replacing existing element
          var oldElm = oldVnode.elm;

          var parentElm$1 = nodeOps.parentNode(oldElm);

          // create new node
          createElm(
            vnode,
            insertedVnodeQueue,
            // extremely rare edge case: do not insert if old element is in a
            // leaving transition. Only happens when combining transition +
            // keep-alive + HOCs. (#4590)
            oldElm._leaveCb ? null : parentElm$1,
            nodeOps.nextSibling(oldElm)
          );

          // update parent placeholder node element, recursively
          if (isDef(vnode.parent)) {
            var ancestor = vnode.parent;
            var patchable = isPatchable(vnode);
            while (ancestor) {
              for (var i = 0; i < cbs.destroy.length; ++i) {
                cbs.destroy[i](ancestor);
              }
              ancestor.elm = vnode.elm;
              if (patchable) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                  cbs.create[i$1](emptyNode, ancestor);
                }
                // #6513
                // invoke insert hooks that may have been merged by create hooks.
                // e.g. for directives that uses the "inserted" hook.
                var insert = ancestor.data.hook.insert;
                if (insert.merged) {
                  // start at index 1 to avoid re-invoking component mounted hook
                  for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                    insert.fns[i$2]();
                  }
                }
              } else {
                registerRef(ancestor);
              }
              ancestor = ancestor.parent;
            }
          }

          // destroy old node
          if (isDef(parentElm$1)) {
            removeVnodes(parentElm$1, [oldVnode], 0, 0);
          } else if (isDef(oldVnode.tag)) {
            invokeDestroyHook(oldVnode);
          }
        }
    }

    // 当VNode节点转换成真实的dom之后
    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

// nodeOps中封装的是真实的dom操作
// createPatchFunction()返回patch函数。
// 这里使用函数柯里化来返回patch函数，是为了同时兼容web平台和weex平台，以便在第一次就将差异提取出来，在真正执行patch函数的时候不用再区分两种平台。
var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

var inBrowser = typeof window !== 'undefined';    

// Vue.prototype.__patch__将vdom转换成真实的dom
// 判断是否是浏览器环境： 如果是浏览器，则赋值patch；如果是服务端，则什么都不做, noop是指一个空函数，因为在服务端是不会出现真实的dom的，所以不需要将虚vdom patch成真实的dom。即：只有浏览器环境才进行patch
Vue.prototype.__patch__ = inBrowser ? patch : noop;


```

* mergeVNodeHook()
```

function mergeVNodeHook (def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {});
  }
  var invoker;
  var oldHook = def[hookKey];

  function wrappedHook () {
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook);
  }

  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook);
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook]);
    }
  }

  invoker.merged = true;
  def[hookKey] = invoker;
}
```

* extractPropsFromVNodeData()
```

function extractPropsFromVNodeData (data, Ctor, tag) {

  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;

  if (isUndef(propOptions)) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;

  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false);
    }
  }
  return res
}
```

* checkProp()
```
function checkProp (res, hash, key, altKey, preserve) {

  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

```

* isWhitespace()
```
function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}
```

* resolveScopedSlots()
```
function resolveScopedSlots (fns, res) {

  res = res || {};
  for (var i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res);
    } else {
      res[fns[i].key] = fns[i].fn;
    }
  }
  return res
}
```

* genClassForVnode()
```

function genClassForVnode (vnode) {

  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode;
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return renderClass(data.staticClass, data.class)
}
```
* mergeClassData()
```

function mergeClassData (child, parent) {

  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}
```
* renderClass()
```

function renderClass (
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

```

* isUnknownElement()
```
var unknownElementCache = Object.create(null);
function isUnknownElement (tag) {

  /* istanbul ignore if */
  if (!inBrowser) {
    return true
  }

  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase();
  /* istanbul ignore if */
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  var el = document.createElement(tag);
  if (tag.indexOf('-') > -1) {
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}
```



* emptyNode => 空节点
```
// 前三个参数一次是： tag, data, children
var emptyNode = new VNode('', {}, []);

```

* createKeyToOldIdx()
```
function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}
```

* directives对象
```
var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode);
  }
}
```
* updateDirectives()
```
function updateDirectives (oldVnode, vnode) {

  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

```
* _update()
```
function _update (oldVnode, vnode) {

  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {

      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', function () {

      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

```

* callHook$1()
```
function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {

  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
    }
  }
}

```
* normalizeDirectives$1()
```

var emptyModifiers = Object.create(null);

function normalizeDirectives$1 (
  dirs,
  vm
) {

  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  // $flow-disable-line
  return res
}

```

* getRawDirName()

```
function getRawDirName (dir) {

  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

```

* updateAttrs()
```

function updateAttrs (oldVnode, vnode) {

  var opts = vnode.componentOptions;
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }
  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;     // elm属性表示vnode的真实的dom节点
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  // 新的属性覆盖旧的属性
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      setAttr(elm, key, cur);  // 给真实的dom元素elm设置属性key
    }
  }
  // #4391: in IE9, setting type can reset value for input[type=radio]
  // #6666: IE/Edge forces progress value down to 1 before setting a max
  /* istanbul ignore if */
  if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value);  // 给真实的dom元素elm设置属性value
  }
  
  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key);
      }
    }
  }
}

```
* setAttr() => 给真实的dom元素el设置属性key
```
// el是真实的dom元素
function setAttr (el, key, value) {

  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value);
  } else if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED'
        ? 'true'
        : key;

      // 真实的dom操作，给el元素设置属性为class, 值为第二个参数
      el.setAttribute(key, value);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    baseSetAttr(el, key, value);
  }
}

```
* baseSetAttr()
```

// el是真实的dom元素
function baseSetAttr (el, key, value) {

  if (isFalsyAttrValue(value)) {
    el.removeAttribute(key);
  } else {
    // #7138: IE10 & 11 fires input event when setting placeholder on
    // <textarea>... block the first input event and remove the blocker
    // immediately.
    /* istanbul ignore if */
    if (
      isIE && !isIE9 &&
      el.tagName === 'TEXTAREA' &&
      key === 'placeholder' && !el.__ieph
    ) {
      var blocker = function (e) {

        // 执行第一个事件处理程序，并阻止剩下的事件处理程序被执行
        e.stopImmediatePropagation();

        // 移除由 document.addEventListener() 方法添加的事件句柄
        el.removeEventListener('input', blocker);
      };

      // oninput 事件在用户输入时触发
      el.addEventListener('input', blocker);

      // $flow-disable-line
      el.__ieph = true; /* IE placeholder patched */
    }

    // 真实的dom操作，给el元素设置属性为class, 值为第二个参数
    el.setAttribute(key, value);
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
}

```

* updateClass()

```

function updateClass (oldVnode, vnode) {

  var el = vnode.elm;
  var data = vnode.data;
  var oldData = oldVnode.data;
  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  var cls = genClassForVnode(vnode);

  // handle transition classes
  var transitionClass = el._transitionClasses;
  if (isDef(transitionClass)) {
    cls = concat(cls, stringifyClass(transitionClass));
  }

  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls);
    el._prevClass = cls;
  }
}

var klass = {
  create: updateClass,
  update: updateClass
}

```