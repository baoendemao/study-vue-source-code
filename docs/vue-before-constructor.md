#### 全局初始化，即在进入Vue构造函数之前做了哪些工作
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
* 初始化componentVNodeHooks
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
* initMixin() => 初始化原型上的_init()

```
function initMixin (Vue) {

  Vue.prototype._init = function (options) {
    var vm = this;

    vm._uid = uid$3++;    

    var startTag, endTag;
    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;    

    // merge options
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
      initProxy(vm);
    }

    // expose real self
    vm._self = vm;

    initLifecycle(vm);    

    initEvents(vm);       

    initRender(vm);       

    callHook(vm, 'beforeCreate');   

    initInjections(vm);

    initState(vm);   

    initProvide(vm);

    callHook(vm, 'created');  

    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);  
    }
  }; 
}  

```

* stateMixin() => 初始化原型上的$data, $props, $set(), $delete(), $watch()

```
function stateMixin (Vue) {

  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.

  var dataDef = {};
  dataDef.get = function () { return this._data };

  var propsDef = {};
  propsDef.get = function () { return this._props };

  {
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
  Object.defineProperty(Vue.prototype, '$data', dataDef);  

  // 在原型上定义$props, 值是this._props。所以之后new出来的Vue实例的$props属性代理了_props属性的访问
  Object.defineProperty(Vue.prototype, '$props', propsDef); 

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

* eventsMixin() => 初始化原型上的事件相关的函数$on(), $once(), $off(), $emit()
```

function eventsMixin (Vue) {

  var hookRE = /^hook:/;

  Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;

    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

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

  Vue.prototype.$off = function (event, fn) {
    var this$1 = this;

    var vm = this;
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
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    if (fn) {
      // specific handler
      var cb;
      var i$1 = cbs.length;
      while (i$1--) {
        cb = cbs[i$1];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i$1, 1);
          break
        }
      }
    }
    return vm
  };

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
    var cbs = vm._events[event];
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
* lifecycleMixin() => 初始化原型上的生命周期相关的函数_update(), $forceUpdate(), $destroy()
```
function lifecycleMixin (Vue) {

  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;

    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;  
    var prevVnode = vm._vnode;
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    vm._vnode = vnode;

    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );

      // no need for the ref nodes after initial patch
      // this prevents keeping a detached DOM tree in memory (#5851)
      vm.$options._parentElm = vm.$options._refElm = null;
    } else {
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

    if (vm._isBeingDestroyed) {
      return
    }

    callHook(vm, 'beforeDestroy');

    vm._isBeingDestroyed = true;

    // remove self from parent
    var parent = vm.$parent;

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
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}
```
* renderMixin() => 初始化渲染相关的函数 $nextTick(), _render(), _o, _n, _s, _l, _t, _q, _i, _m, _f, _k, _b, _v, _e, _u, _g
```
function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
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
      if ("development" !== 'production' && Array.isArray(vnode)) {
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

```
// target是Vue.prototype
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
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
}
```

* initGlobalAPI() => 初始化Vue.config, Vue.util, Vue.set, Vue.delete, Vue.nextTick, Vue.options, 并调用initUse(), initMixin$(), initExtend(), initAssetRegisters()

```

function initGlobalAPI (Vue) {
  var configDef = {};
  configDef.get = function () { return config; };
  {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }

  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {   
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;     

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);  
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

```

* initUse() => 初始化Vue.use
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
      plugin.install.apply(plugin, args);    
    } else if (typeof plugin === 'function') {
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
   */
  Vue.extend = function (extendOptions) {

    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if ("development" !== 'production' && name) {
      validateComponentName(name);
    }

    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);  
    Sub.prototype.constructor = Sub;

    Sub.cid = cid++;
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

* initAssetRegisters()
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

    Vue[type] = function (id, definition) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if ("development" !== 'production' && type === 'component') {
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
* 初始化Vue.config
```
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

extend(Vue.options.directives, platformDirectives);

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
}
extend(Vue.options.components, platformComponents);
```
