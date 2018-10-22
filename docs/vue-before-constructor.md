#### Vue的全局初始化工作（ 即在new Vue()进入Vue构造函数之前做了哪些初始化工作：初始化Vue全局属性方法，初始化Vue原型属性和方法）
* 初始化Version
```

Vue.version = '2.5.16';

```

* 初始化Dep构造函数

* 初始化vNode

```
var VNode = function VNode (tag, data, children, text, elm, context, componentOptions, asyncFactory) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
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
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
}

```

* 初始化Observer

* 初始化各种map, makeMap()

* 初始化异步任务处理机制 => 宏任务macro task， 微任务micro task

```
// 三个全局变量
var microTimerFunc;         //  微任务micro task函数
var macroTimerFunc;         //  宏任务macro task函数
var useMacroTask = false;   //  默认使用micro task微任务

// 宏任务macro task:  setImmediate => MessageChannel => setTimeout
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {

  macroTimerFunc = function () {
    setImmediate(flushCallbacks);
  };

} else if (typeof MessageChannel !== 'undefined' && (

  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'

)) {

  var channel = new MessageChannel();
  // port1来onmessage，port2来postMessage
  var port = channel.port2;
  channel.port1.onmessage = flushCallbacks;
  macroTimerFunc = function () {
    port.postMessage(1);
  };

} else {

  /* istanbul ignore next */
  macroTimerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };

}

// 微任务micro task : Promise => macroTimerFunc
if (typeof Promise !== 'undefined' && isNative(Promise)) {

  var p = Promise.resolve();

  microTimerFunc = function () {
    p.then(flushCallbacks);
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
  };

} else {

  // fallback to macro
  microTimerFunc = macroTimerFunc;

}

```

* withMacroTask()

```

function withMacroTask (fn) {

  return fn._withTask || (fn._withTask = function () {
    useMacroTask = true;
    var res = fn.apply(null, arguments);
    useMacroTask = false;
    return res
  })

}

```
* nextTick() => 挂载到Vue.nextTick和Vue.prototype.nextTick => 全局使用

```

function nextTick (cb, ctx) {

  var _resolve;
  callbacks.push(function () {
  
    if (cb) {
      // 防止外面传入的callback函数会报出异常
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });

  // pending是全局变量，保证if里的代码只执行一次
  if (!pending) {
    pending = true;

    if (useMacroTask) {   // 使用宏任务
      macroTimerFunc(); 
    } else {        // 使用微任务
      microTimerFunc();
    }
  }

  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

Vue.nextTick = nextTick;
```

* 初始化componentVNodeHooks => 组件的钩子hooks： init, prepatch, insert, destroy

```
var componentVNodeHooks = {
  init: function init (vnode, hydrating, parentElm, refElm) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance,
        parentElm,
        refElm
      );

      // 子组件的$mount，其实实质上是vue.prototype.$mount
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },

  prepatch: function prepatch (oldVnode, vnode) {
    var options = vnode.componentOptions;
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy: function destroy (vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
};


var hooksToMerge = Object.keys(componentVNodeHooks);

```

* 初始化原型上$mount
```
var inBrowser = typeof window !== 'undefined';    


Vue.prototype.$mount = function (el, hydrating) {

  el = el && inBrowser ? query(el) : undefined;  
  return mountComponent(this, el, hydrating)
};
```

* Vue构造函数的相关初始化

```

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

```

* initMixin() => 初始化Vue原型上的_init()

```
// Vue作为形参
function initMixin (Vue) {

  Vue.prototype._init = function (options) {
    var vm = this;

    vm._uid = uid$3++;    

    // 生产环境下，对性能进行检测
    // 通过mark上startTag和endTag
    var startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // Vue自身实例this防止被观察
    vm._isVue = true;    

    // 合并options，并挂载到vm.$options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
      
    }

    /* istanbul ignore else */
    {
      // 在vm上添加_renderProxy属性
      initProxy(vm);
    }

    // expose real self
    vm._self = vm;

    initLifecycle(vm);     // 初始化生命周期

    initEvents(vm);        // 初始化事件

    initRender(vm);        // 初始化渲染render

    callHook(vm, 'beforeCreate');    // 在生命周期beforeCreated

    initInjections(vm); 

    initState(vm);     // 初始化prop/data/computed/methods/watch被观察

    initProvide(vm);   

    callHook(vm, 'created');   // 在生命周期created

    /* istanbul ignore if */
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      // 挂载
      vm.$mount(vm.$options.el);  
    }
  }; 
}  

```

* stateMixin() => 初始化原型上的$data, $props, $set(), $delete(), $watch()

```
// Vue作为形参
function stateMixin (Vue) {

  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.

  var dataDef = {};
  dataDef.get = function () { return this._data };

  var propsDef = {};
  propsDef.get = function () { return this._props };

  // 不能set， 即$data和$props都是只读属性
  // 只有生产环境才会报出警告
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };

    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  
  // 在原型上定义$data, 值是this._data。所以之后new出来的Vue实例的$data属性代理了_data属性的访问
  Object.defineProperty(Vue.prototype, '$data', dataDef);   // 属性$data具有get和set

  // 在原型上定义$props, 值是this._props。所以之后new出来的Vue实例的$props属性代理了_props属性的访问
  Object.defineProperty(Vue.prototype, '$props', propsDef);  // 属性$props具有get和set

  // Vue实例可以使用this.$set创建被可被观察的属性。
  // 为什么还要用这种this.$set()的方式添加属性？ 因为实例创建之后再添加属性，新添加的属性是不会被观察的。
  Vue.prototype.$set = set;

  // Vue实例删除属性，可以被观察到， this.$delete()
  Vue.prototype.$delete = del;

  // Vue实例watch属性的改变，this.$watch()
  // expOrFn检测的属性，callback函数，
  // options可选参数: deep, immediate
  Vue.prototype.$watch = function (expOrFn, cb, options) {

    var vm = this;

    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }

    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);

    // 在选项参数中指定 immediate: true 将立即以表达式的当前值触发回调
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }

    return function unwatchFn () {
      watcher.teardown();
    }
  };

}  

```

* eventsMixin() => 初始化原型上的事件相关的函数$on(), $once(), $off(), $emit() => 主要操作的是vm._events数组
```
// Vue作为形参
function eventsMixin (Vue) {

  var hookRE = /^hook:/;

  // 监听自定义事件(由vm.$emit触发的事件)
  Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;

    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      // vm._events数组保存自定义事件

      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  // 监听一个自定义事件，但是只触发一次，且第一次触发之后就移除监听器
  Vue.prototype.$once = function (event, fn) {
    var vm = this;

    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }

    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  // 移除自定义事件监听器， 在Vue.prototype.$destroy()销毁组件中被调用
  Vue.prototype.$off = function (event, fn) {
    var this$1 = this;

    var vm = this;

    // 如果该函数没有提供参数，则移除所有的事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }

    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$off(event[i], fn);
      }
      return vm
    }

    // specific event
    // 获取该事件的所有事件监听器
    var cbs = vm._events[event]; 
    if (!cbs) {
      return vm
    }
    
    // 如果该函数只提供了第一个参数，则移除该事件的所有的事件监听器
    if (!fn) {
      vm._events[event] = null;
      return vm
    }

    // 如果该函数提供了两个参数，则移除这个回调的监听器
    if (fn) {
      // specific handler
      var cb;
      var i$1 = cbs.length;
      while (i$1--) {
        cb = cbs[i$1];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i$1, 1);   // 从vm._events中删除
          break
        }
      }
    }
    return vm
  };

  // 触发当前实例上的事件 => 在vm._events数组中找到对应的事件处理器，进行调用
  Vue.prototype.$emit = function (event) {

    var vm = this;
    {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }

    var cbs = vm._events[event];   // callback

    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);  
      for (var i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args);
        } catch (e) {
          handleError(e, vm, ("event handler for \"" + event + "\""));
        }
      }
    }
    return vm
  };
} 

```

* nodeOps => 由VNode创建真实的dom => nodeOps对象中封装的都是真实的dom操作 => 不同的平台，nodeOps分装了不同的操作，进而vue实现了跨平台, 这里只来看浏览器web的部分，不考虑weex

```

// 根据标签名tagName创建html dom，并返回
function createElement$1 (tagName, vnode) {

  var elm = document.createElement(tagName);
  if (tagName !== 'select') {
    return elm
  }

  // 针对<select>元素：
  // false or null will remove the attribute but undefined will not
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {

    // 真实的dom操作：setAttribute() 方法创建或改变某个新属性。如果指定属性已经存在,则只设置该值。
    elm.setAttribute('multiple', 'multiple');
  }

  return elm
}

// 真实的dom操作
function createElementNS (namespace, tagName) {
  // createElementNS() 方法创建带有命名空间的元素节点。该方法返回 Element 对象。
  return document.createElementNS(namespaceMap[namespace], tagName)
}

// 真实的dom操作：createTextNode() 来创建文本节点，参数为文本节点的文本
function createTextNode (text) {
  return document.createTextNode(text)
}

// 真实的dom操作：createComment()来创建注释节点，参数为注释的文本
function createComment (text) {
  return document.createComment(text)
}

// 真实的dom操作： 在referenceNode子节点前插入一个新的子节点newNode。
function insertBefore (parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

// 真实的dom操作：从node的子节点列表中删除子节点child
function removeChild (node, child) {
  node.removeChild(child);
}

// 真实的dom操作： 在node的子节点列表的末尾添加新的子节点child
function appendChild (node, child) {
  node.appendChild(child);
}

// 真实的dom操作：parentNode属性返回节点node的父节点
function parentNode (node) {

  return node.parentNode
}

// 真实的dom操作： nextSibling属性返回元素node之后紧跟的节点（处于同一树层级中）
function nextSibling (node) {
  return node.nextSibling
}

// 真实的dom操作：tagName属性返回元素的标签名
function tagName (node) {
  return node.tagName
}

// 真实的dom操作：textContent 属性设置或者返回指定节点的文本内容。
function setTextContent (node, text) {
  node.textContent = text;
}

// 真实的dom操作：node元素中添加新的属性名字为scopedId，值为''
function setStyleScope (node, scopeId) {
  // setAttribute() 方法添加新属性。 如果元素中已经存在指定名称的属性，它的值更改为value的值。
  node.setAttribute(scopeId, '');
}


// 封装真实的dom操作
var nodeOps = Object.freeze({
	createElement: createElement$1,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	createComment: createComment,
	insertBefore: insertBefore,
	removeChild: removeChild,
	appendChild: appendChild,
	parentNode: parentNode,
	nextSibling: nextSibling,   
	tagName: tagName,
	setTextContent: setTextContent,
	setStyleScope: setStyleScope
});

```

* lifecycleMixin() => 初始化原型上的生命周期相关的函数_update(), $forceUpdate(), $destroy()

```
Vue.prototype.__patch__ = inBrowser ? patch : noop;

// Vue作为形参
function lifecycleMixin (Vue) {

  // _update: 将render函数生成的VNode渲染成真实的dom
  // _update的调用时刻：(1)首次渲染  （2）数据改变 => mvvm => 重新渲染
  // 参数二hydrating: 只有在服务器端的时候为true。 注意：在服务器端，不需要讲VNode渲染成真实的dom。所以在服务器端，__patch__函数是个空函数，什么也不做。

  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;

    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;        // 上一次挂载的 $el
    var prevVnode = vm._vnode;  // 上一次的vnode保存起来
    var prevActiveInstance = activeInstance;  
    activeInstance = vm;

    vm._vnode = vnode;  

    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render首次渲染

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
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }

    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype.$forceUpdate = function () {

    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;

    // _isBeingDestroyed属性标识着正在被销毁，这里的判断可以防止被重复销毁
    if (vm._isBeingDestroyed) {
      return
    }

    callHook(vm, 'beforeDestroy');

    vm._isBeingDestroyed = true;

    // remove self from parent，从父组件的$children数组中删除自己
    var parent = vm.$parent;

    // vm.$options.abstract是抽象组件，例如keep-alive，transition
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }

    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }

    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }

    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }

    // call the last hook...
    vm._isDestroyed = true;

    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);

    // fire destroyed hook
    callHook(vm, 'destroyed');

    // turn off all instance listeners.
    vm.$off();

    // remove __vue__ reference

    if (vm.$el) {
      vm.$el.__vue__ = null;
    }

    // release circular reference (#6759)
    if (vm.$vnode) {  // vm的父节点vnode
      vm.$vnode.parent = null;
    }
  };
}

```

* renderMixin() => 初始化渲染相关的函数 $nextTick(), _render(), _o, _n, _s, _l, _t, _q, _i, _m, _f, _k, _b, _v, _e, _u, _g => 这些简短的函数将会在渲染字符串中使用

```
// Vue作为形参
function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype); // 在Vue.prototype上添加渲染辅助函数，如_o, _n等

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  // 将vm渲染成VNode, 并返回该VNode
  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;   // 外面传入的render属性，即用户自定义的render
    var _parentVnode = ref._parentVnode;  // 父vnode

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
      /*
       * 外边传入的render函数:
       * render: function(createElement) {
            return createElement('div', 
                {
                  attrs: {id: 'app'}, 
                },
                this.hello
            );
          }
       * 通过createElement()函数创建了vnode
       */
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
}  

```

* installRenderHelpers() => 在target上添加15个短属性

```
// 调用：installRenderHelpers(Vue.prototype); => target是Vue.prototype
function installRenderHelpers (target) {

  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;   // 创建文本VNode节点
  target._e = createEmptyVNode;  // 创建空VNode节点， isComment属性是true, 即注释节点
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
}
```

* initGlobalAPI() => 初始化全局属性：Vue.config, Vue.util, Vue.set, Vue.delete, Vue.nextTick, Vue.options, 并调用initUse(), initMixin$(), initExtend(), initAssetRegisters()来初始化Vue上其他的全局属性

```

function initGlobalAPI (Vue) {
  var configDef = {};
  configDef.get = function () { return config; };

  if (process.env.NODE_ENV !== 'production') {
    // Vue.config不允许set
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }

  // Vue.config是一个只读属性
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 不建议外面的库去使用Vue.util, 因为不稳定
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  // Vue和Vue的子类都会有options属性
  Vue.options = Object.create(null);  

  //  'component', 'directive', 'filter'
  ASSET_TYPES.forEach(function (type) {   
    //  Vue.options.components, Vue.options.directives, Vue.options.filters
    //  Vue.options = {
    //      components: Object.create(null),
    //      directives: Object.create(null),
    //      filters: Object.create(null),
    //  }

      Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;     

  // builtInComponents是vue的内置组件，将其拓展到Vue.options.components对象上
  // builtInComponents如： keep-alive, transition, transition-group
  //  Vue.options = {
  //      components: { KeepAlive },
  //      directives: Object.create(null),
  //      filters: Object.create(null),
  //      _base: Vue
  //  }
  extend(Vue.options.components, builtInComponents);

  // 初始化Vue.use
  initUse(Vue);  

  // 初始化Vue.mixin()
  initMixin$1(Vue);

  // 初始化Vue.extend()
  initExtend(Vue);

  // 初始化Vue.component，Vue.directive，Vue.filter
  initAssetRegisters(Vue);
}

```


* initUse() => 初始化Vue.use => 安装vue的插件，如vue-router, vuex

```

function initUse (Vue) {

  Vue.use = function (plugin) {

    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));

    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1);   
    args.unshift(this);

   
    if (typeof plugin.install === 'function') {

       // 如果插件是一个对象，必须提供install方法
      plugin.install.apply(plugin, args);    

    } else if (typeof plugin === 'function') {

      // 如果插件是一个函数，会被当做install方法
      plugin.apply(null, args);    

    }
    
    installedPlugins.push(plugin);
    return this
  };
}

```

* initMixin$1() => 初始化Vue.mixin()
```
function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}
```

* initExtend() => 初始化Vue.extend()
```
function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   * 创建Vue子类，返回子的构造器
   * 
   * 例如：
   * var child = Vue.extend(); 
   * console.log(child.super)  // Vue
   */
  Vue.extend = function (extendOptions) {

    extendOptions = extendOptions || {};
    var Super = this;    // this是Vue
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // 组件的name
    var name = extendOptions.name || Super.options.name;

    // 开发环境下
    if (process.env.NODE_ENV !=='production' && name) {
      // 检测name是否是有效的组件名字
      validateComponentName(name);
    }

    // 子组件的构造函数
    var Sub = function VueComponent (options) {
      this._init(options);   // 调用vue原型上的_init()
    };

    // 原型继承
    Sub.prototype = Object.create(Super.prototype);  
    Sub.prototype.constructor = Sub;

    Sub.cid = cid++;

    // 合并父子的options属性
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }

    // 如果子组件Sub有computed属性
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

``` 
* initProps$1()
```
function initProps$1 (Comp) {

  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}
```

* initComputed$1()

```
// 参数Comp是组件
function initComputed$1 (Comp) {

  var computed = Comp.options.computed;
  for (var key in computed) {

    // 在组件的原型上定义属性key
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

```

* initAssetRegisters() => 初始化Vue.component，Vue.directive，Vue.filter

```
var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

function initAssetRegisters (Vue) {

  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {

    // Vue.component: 全局注册组件
    // Vue.directive: 全局注册指令
    // Vue.filter: 全局注册过滤器
    Vue[type] = function (id, definition) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !=='production' && type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

```

* 原型上初始化属性$isServer 和 $ssrContext => 判断是否是服务器端渲染

```
var SSR_ATTR = 'data-server-rendered';   // 服务器端渲染的标志

var _isServer;   

var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// Vue原型上定义新属性$isServer
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
});

// Vue原型上定义新属性$ssrContext
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get: function get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

```

* 初始化 Vue.FunctionalRenderContext
```
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {  
  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm;
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent);
    // $flow-disable-line
    contextVm._original = parent;
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () { 
    return resolveSlots(children, parent); };

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = data.scopedSlots || emptyObject;
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {

      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { 
      return createElement(contextVm, a, b, c, d, needNormalization); 
    };
  }
}

// 在FunctionalRenderContext.prototype上添加渲染辅助函数，如_o，_n等
// 为了ssr中使用
installRenderHelpers(FunctionalRenderContext.prototype);

```

* 初始化Vue.config

```
var isReservedAttr = makeMap('style,class');


Vue.config.mustUseProp = mustUseProp;
Vue.config.isReservedTag = isReservedTag;
Vue.config.isReservedAttr = isReservedAttr;
Vue.config.getTagNamespace = getTagNamespace;
Vue.config.isUnknownElement = isUnknownElement;

```

* 初始化Vue.options 
```
var platformDirectives = {
  model: directive,
  show: show
};

// Vue.options.directives此对象的属性有： model, show
extend(Vue.options.directives, platformDirectives);

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
}

// Vue.options.components此对象的属性有： KeepAlive, Transition, TransitionGroup
extend(Vue.options.components, platformComponents);

```

* createCompilerCreator()

```
function createCompilerCreator (baseCompile) {

  return function createCompiler (baseOptions) {
    function compile (template, options) {
      var finalOptions = Object.create(baseOptions);
      var errors = [];
      var tips = [];
      finalOptions.warn = function (msg, tip) {
        (tip ? tips : errors).push(msg);
      };

      if (options) {
        // merge custom modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules);
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          );
        }
        // copy other options
        for (var key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key];
          }
        }
      }

      var compiled = baseCompile(template, finalOptions);
      {
        errors.push.apply(errors, detectErrors(compiled.ast));
      }
      compiled.errors = errors;
      compiled.tips = tips;
      return compiled
    }

    return {
      compile: compile,    
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
```
* createCompileToFunctionFn()
```
// 柯厘化
function createCompileToFunctionFn (compile) {

  // 闭包，防止字符串模板template重复编译
  var cache = Object.create(null);

  return function compileToFunctions (template, options, vm) {

    options = extend({}, options);
    var warn$$1 = options.warn || warn;
    delete options.warn;

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      // detect possible CSP restriction
      try {
        new Function('return 1');
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn$$1(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          );
        }
      }
    }

    // check cache
    // cache: 防止字符串模板template重复编译
    var key = options.delimiters       // delimiters改变纯文本插入分隔符的用法
      ? String(options.delimiters) + template
      : template;
    if (cache[key]) {  
      return cache[key]
    }

    // compile
    var compiled = compile(template, options);

    // check compilation errors/tips
    {
      if (compiled.errors && compiled.errors.length) {
        warn$$1(
          "Error compiling template:\n\n" + template + "\n\n" +
          compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
          vm
        );
      }
      if (compiled.tips && compiled.tips.length) {
        compiled.tips.forEach(function (msg) { return tip(msg, vm); });
      }
    }

    // turn code into functions
    var res = {};
    var fnGenErrors = [];

    res.render = createFunction(compiled.render, fnGenErrors);
    res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
      return createFunction(code, fnGenErrors)
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn$$1(
          "Failed to generate render function:\n\n" +
          fnGenErrors.map(function (ref) {
            var err = ref.err;
            var code = ref.code;

            return ((err.toString()) + " in\n\n" + code + "\n");
        }).join('\n'),
          vm
        );
      }
    }

    return (cache[key] = res)
  }
}
```

* createCompiler()

```
var createCompiler = createCompilerCreator(
  function baseCompile (template, options) {

    var ast = parse(template.trim(), options);

    if (options.optimize !== false) {
      optimize(ast, options);
    }

    var code = generate(ast, options);

    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  }
);

```

* Vue.compile => 将compileToFunctions挂在到Vue.compile上 => runtime + compile版本的vue需要做这一步

```

var baseOptions = {
  expectHTML: true,
  modules: modules$1,
  directives: directives$1,
  isPreTag: isPreTag,
  isUnaryTag: isUnaryTag,
  mustUseProp: mustUseProp,
  canBeLeftOpenTag: canBeLeftOpenTag,
  isReservedTag: isReservedTag,
  getTagNamespace: getTagNamespace,
  staticKeys: genStaticKeys(modules$1)
};

var ref$1 = createCompiler(baseOptions);

var compileToFunctions = ref$1.compileToFunctions;

Vue.compile = compileToFunctions;   // 全局API， 将模板template字符串编译成render function

```

```
Vue.compile调用方式：

var res = Vue.compile('<div><span>{{ msg }}</span></div>')  

new Vue({
  data: {
    msg: 'hello'
  },
  render: res.render,     // render字段， 是一个function。 如果这边传入了render字段，就会跳过模板compile的过程，直接渲染。
  staticRenderFns: res.staticRenderFns
})

```

* 声明shouldDecodeNewlines 和 shouldDecodeNewlinesForHref

```
var div;
function getShouldDecode (href) {

  div = div || document.createElement('div');
  div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
  return div.innerHTML.indexOf('&#10;') > 0
}

// #3663: IE encodes newlines inside attribute values while other browsers don't
var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;

// #6828: chrome encodes content in a[href]
var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

```


* 初始化strats对象 => 存放合并父子各个属性的策略（strategys） <br/>
defaultStrat => 默认合并策略 => 如果有属性没有定义的合并策略，则直接使用默认合并策略。

```

// 默认合并策略： 如果子没有，则默认使用父的
var defaultStrat = function (parentVal, childVal) {   
  return childVal === undefined
    ? parentVal
    : childVal
};
```

* strats.el, strats.propsData => el和propsData的父子合并策略
```

// config.optionMergeStrategies: 自定义合并策略
var strats = config.optionMergeStrategies;


if (process.env.NODE_ENV !== 'production') {

  strats.el = strats.propsData = function (parent, child, vm, key) {
      if (!vm) {
        // 如果没有传递vm, 则说明是在子类中调用的mergeOptions()
        // 只有实例化之后才可以使用key这个option
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      return defaultStrat(parent, child)
  };

}
```

* strats.data => data的父子合并策略

```

// 参数parentVal是指的父类的data属性，参数childVal是指的子类的data属性
strats.data = function (
  parentVal,
  childVal,
  vm
) {

  if (!vm) {
    //  data选项必须是函数, 如果不是函数则只返回父的
    if (childVal && typeof childVal !== 'function') {
      
      process.env.NODE_ENV !=='production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};
```

* mergeHook() => 生命周期钩子的父子合并策略 => <br/>
strats.beforeCreate, strats.created, strats.beforeMount, strats.mounted, strats.beforeUpdate, strats.updated, strats.beforeDestroy, strats.destroyed, strats.activated, strats.deactivated, strats.errorCaptured

```
function mergeHook (
  parentVal,
  childVal
) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}
```

```
// 生命周期钩子, 11种钩子
var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured'
];

LIFECYCLE_HOOKS.forEach(function (hook) {

  // 在strats数组中，会添加上面的生命周期钩子属性
  strats[hook] = mergeHook;
});

```

* mergeAssets() => merge选项：component, directive, filter => 这些属性的父子合并策略<br/>
strats.components, strats.directive, strats.filters

```
function mergeAssets (
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    // 判断childVal是否是一个纯对象
    process.env.NODE_ENV !=='production' && assertObjectType(key, childVal, vm);

    return extend(res, childVal)

  } else {
    return res
  }
}
```

```
var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];


ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});
```

* strats.watch => watch的父子合并策略 => 将父子的watch属性合并成一个数组

```
// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;

strats.watch = function (parentVal, childVal, vm, key) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }

  // 最后返回值
  var ret = {};   

  // parentVal的属性混合到ret中
  extend(ret, parentVal);

  // 遍历子vm的属性，如果父也存在，则混合到一起返回一个数组
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];

    // 如果parent存在，则将其转换为数组
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }

    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }

  return ret
};
```

* strats.props, strats.methods, strats.inject, strats.computed => props、methods、inject、computed 的父子合并策略

```
strats.props =
strats.methods =
strats.inject =
strats.computed = function (parentVal, childVal, vm, key) {

  if (childVal && process.env.NODE_ENV !=='production') {
    // 判断childVal是否是一个纯对象
    assertObjectType(key, childVal, vm);
  }

  if (!parentVal) { return childVal }

  var ret = Object.create(null);

  extend(ret, parentVal);

  if (childVal) { extend(ret, childVal); }

  return ret
};

```

* strats.provide => provide属性的合并策略

```
strats.provide = mergeDataOrFn;


```
<br/>

#### 经过全局初始化后，此时的Vue.prototype:

```
$delete
$destroy
$emit
$forceUpdate
$mount
$nextTick
$off
$on
$once
$set
$watch
__patch__
_b
_e
_f
_g
_i
_init
_k
_l
_m
_n
_o
_q
_render
_s
_t
_u
_update
_v
$data
$isServer
$props
$ssrContext
constructor
get $data
set $data
get $isServer
get $props
set $props
get $ssrContext
__proto__

```

```
Vue.prototype.__proto__ === Object.prototype;    // true

```

* KeepAlive对象
```
function matches (pattern, name) {

  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance, filter) {

  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry (
  cache,
  key,
  keys,
  current
) {

  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created: function created () {

    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed: function destroyed () {
    var this$1 = this;

    for (var key in this$1.cache) {
      pruneCacheEntry(this$1.cache, key, this$1.keys);
    }
  },

  mounted: function mounted () {
    var this$1 = this;

    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) { return matches(val, name); });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) { return !matches(val, name); });
    });
  },

  render: function render () {
    var slot = this.$slots.default;
    var vnode = getFirstComponentChild(slot);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
}


// builtInComponents： vue的内置组件对象， 如KeepAlive
var builtInComponents = {
  KeepAlive: KeepAlive
}
```

* 
```


var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

// html元素具有enable, disable含义的元素属性
var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var xlinkNS = 'http://www.w3.org/1999/xlink';

var isXlink = function (name) {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
};

var getXlinkProp = function (name) {
  return isXlink(name) ? name.slice(6, name.length) : ''
};

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

```

* ref对象
```
var ref = {
  create: function create (_, vnode) {
    registerRef(vnode);
  },
  update: function update (oldVnode, vnode) {

    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy (vnode) {
    registerRef(vnode, true);
  }
}


function registerRef (vnode, isRemoval) {

  var key = vnode.data.ref;
  if (!isDef(key)) { return }

  var vm = vnode.context;
  var ref = vnode.componentInstance || vnode.elm;

  var refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}

```
* platformModules => 

```

var baseModules = [
  ref,           // {create: , destroy:,  update:,}
  directives     // {create: , destroy:,  update:,}
]

var platformModules = [
  attrs,        // {create: updateAttrs(),  update: updateAttrs()}
  klass,        // {create: updateClass(),  update: updateClass()}
  events,       // {create: updateDOMListeners(),  update: updateDOMListeners()}
  domProps,     // {create: updateDOMProps(),  update: updateDOMProps()}
  style,        // {create: updateStyle(),  update: updateStyle()}
  transition
]

var modules = platformModules.concat(baseModules);

```

* 
```
if (isIE9) {
  // http://www.matts411.com/post/internet-explorer-9-oninput/
  document.addEventListener('selectionchange', function () {
    var el = document.activeElement;
    if (el && el.vmodel) {
      trigger(el, 'input');
    }
  });
}
```

* directive对象
```

var directive = {
  inserted: function inserted (el, binding, vnode, oldVnode) {

    if (vnode.tag === 'select') {
      // #6903
      if (oldVnode.elm && !oldVnode.elm._vOptions) {
        mergeVNodeHook(vnode, 'postpatch', function () {
          directive.componentUpdated(el, binding, vnode);
        });
      } else {
        setSelected(el, binding, vnode.context);
      }
      el._vOptions = [].map.call(el.options, getValue);
    } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
      el._vModifiers = binding.modifiers;
      if (!binding.modifiers.lazy) {
        el.addEventListener('compositionstart', onCompositionStart);
        el.addEventListener('compositionend', onCompositionEnd);
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        el.addEventListener('change', onCompositionEnd);
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true;
        }
      }
    }
  },

  componentUpdated: function componentUpdated (el, binding, vnode) {

    if (vnode.tag === 'select') {
      setSelected(el, binding, vnode.context);
      // in case the options rendered by v-for have changed,
      // it's possible that the value is out-of-sync with the rendered options.
      // detect such cases and filter out values that no longer has a matching
      // option in the DOM.
      var prevOptions = el._vOptions;
      var curOptions = el._vOptions = [].map.call(el.options, getValue);
      if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
        // trigger change event if
        // no matching option found for at least one value
        var needReset = el.multiple
          ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
          : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
        if (needReset) {
          trigger(el, 'change');
        }
      }
    }
  }
};


function setSelected (el, binding, vm) {

  actuallySetSelected(el, binding, vm);
  /* istanbul ignore if */
  if (isIE || isEdge) {
    setTimeout(function () {
      actuallySetSelected(el, binding, vm);
    }, 0);
  }
}

function actuallySetSelected (el, binding, vm) {

  var value = binding.value;
  var isMultiple = el.multiple;
  if (isMultiple && !Array.isArray(value)) {
    process.env.NODE_ENV !=='production' && warn(
      "<select multiple v-model=\"" + (binding.expression) + "\"> " +
      "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
      vm
    );
    return
  }
  var selected, option;
  for (var i = 0, l = el.options.length; i < l; i++) {
    option = el.options[i];
    if (isMultiple) {
      selected = looseIndexOf(value, getValue(option)) > -1;
      if (option.selected !== selected) {
        option.selected = selected;
      }
    } else {
      if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i;
        }
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1;
  }
}

function hasNoMatchingOption (value, options) {

  return options.every(function (o) { return !looseEqual(o, value); })
}

function getValue (option) {

  return '_value' in option
    ? option._value
    : option.value
}

function onCompositionStart (e) {

  e.target.composing = true;
}

function onCompositionEnd (e) {

  // prevent triggering an input event for no reason
  if (!e.target.composing) { return }
  e.target.composing = false;
  trigger(e.target, 'input');
}
```

* show对象
```
function locateNode (vnode) {
  return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
    ? locateNode(vnode.componentInstance._vnode)
    : vnode
}

var show = {
  bind: function bind (el, ref, vnode) {

    var value = ref.value;

    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    var originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display;
    if (value && transition$$1) {
      vnode.data.show = true;
      enter(vnode, function () {
        el.style.display = originalDisplay;
      });
    } else {
      el.style.display = value ? originalDisplay : 'none';
    }
  },

  update: function update (el, ref, vnode) {

    var value = ref.value;
    var oldValue = ref.oldValue;

    /* istanbul ignore if */
    if (!value === !oldValue) { return }
    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    if (transition$$1) {
      vnode.data.show = true;
      if (value) {
        enter(vnode, function () {
          el.style.display = el.__vOriginalDisplay;
        });
      } else {
        leave(vnode, function () {
          el.style.display = 'none';
        });
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none';
    }
  },

  unbind: function unbind (
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {

    if (!isDestroy) {
      el.style.display = el.__vOriginalDisplay;
    }
  }
}
```

* devtools
```
if (inBrowser) {
  setTimeout(function () {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue);
      } else if (
        process.env.NODE_ENV !=='production' &&
        process.env.NODE_ENV !=='test' &&
        isChrome
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        );
      }
    }
    if (process.env.NODE_ENV !=='production' &&
      process.env.NODE_ENV !=='test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        "You are running Vue in development mode.\n" +
        "Make sure to turn on production mode when deploying for production.\n" +
        "See more tips at https://vuejs.org/guide/deployment.html"
      );
    }
  }, 0);
}

```