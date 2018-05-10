##### 如何初始化Vue实例vm (this), ( 即this._init()做的什么工作 )
* 从Vue构造函数进入

```
function Vue (options) {  
  if ("development" !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);    
}
```

* this._init()调用 => 进入Vue.prototype_init() => 初始化vm.$options, vm._isVue, vm._self, vm._uid

```
// 参数options是用户new Vue()传进来的对象
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
      // 处理用户传来的options
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

    initLifecycle(vm);     // 初始化生命周期

    initEvents(vm);        // 初始化事件

    initRender(vm);        // 初始化渲染render

    callHook(vm, 'beforeCreate');    // 在生命周期beforeCreated

    initInjections(vm); 

    initState(vm);     // 初始化prop/data/computed/methods/watch被观察

    initProvide(vm);   

    callHook(vm, 'created');   // 在生命周期created

    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);   // 模板的编译，渲染
    }
};
```

* 处理用户传来new Vue的实参options

```
function resolveConstructorOptions (Ctor) {

  var options = Ctor.options;   

  if (Ctor.super) {    
    var superOptions = resolveConstructorOptions(Ctor.super);

    var cachedSuperOptions = Ctor.superOptions;

    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;   

      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);

      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }

      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);

      if (options.name) {
        options.components[options.name] = Ctor;
      }

    }
  }
  return options
}

```

```
function mergeOptions (
  parent,
  child,
  vm
) {

  {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }
  normalizeProps(child, vm);   
  normalizeInject(child, vm);   
  normalizeDirectives(child);   

  var extendsFrom = child.extends;
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm);
  } 

  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }

  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;  
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}
```

```
// 检查是否是有效组件名
function validateComponentName (name) {

  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    );
  }

  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}
```

```
// 检查options传入的组件名是否是有效的
function checkComponents (options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}
```

```
// 处理传入的options.props格式化成对象
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }

  var res = {};
  var i, val, name;
  
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {

        name = camelize(val);
        res[name] = { type: null };
      } else {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];

      name = camelize(key);
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  } else {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}
```

```
// 处理options.inject
function normalizeInject (options, vm) {

  var inject = options.inject;
  if (!inject) { return }
  var normalized = options.inject = {};

  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val };
    }
  } else {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}
```

```
// 处理options.directives
function normalizeDirectives (options) {

  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def = dirs[key];
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def };
      }
    }
  }
}
```

```
function assertObjectType (name, value, vm) {

  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}
```

```
function mergeDataOrFn (parentVal, childVal, vm) {
  if (!vm) {

    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }

    if (!parentVal) {
      return childVal
    }

    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {

    return function mergedInstanceDataFn () {

      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}
```

```
function mergeData (to, from) {

  if (!from) { return to }
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}
```

```
处理后的options此时包含：

components
data
directives
el
filters
methods
mounted
render
staticRenderFns
watch
_base
_parentElm
_refElm
__proto__

```

* initProxy() => 初始化vm._renderProxy

在_init()中调用： initProxy(vm)

```

var initProxy;

var hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy);

initProxy = function initProxy (vm) {
    if (hasProxy) {
        // determine which proxy handler to use
        var options = vm.$options;
        var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;

        vm._renderProxy = new Proxy(vm, handlers);

    } else {
        vm._renderProxy = vm;
    }
};

```

* 初始化vm的生命周期相关属性 => $parent, $root, $children, $refs, _watcher, _inactive, _directInactive, _isMounted, _isDestroyed, _isBeingDestroyed

```
function initLifecycle (vm) {

  var options = vm.$options;  

  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;

  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;

}

```

* initEvents() 初始化vm的事件相关属性 => _events, _hasHookEvent
```
function initEvents (vm) {

  vm._events = Object.create(null);
  vm._hasHookEvent = false;

  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
```

```
function updateListeners (on, oldOn, add, remove$$1, vm) {

  var name, def, cur, old, event;

  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];

    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (isUndef(cur)) {
      "development" !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }

  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}
```

```
function updateComponentListeners (vm, listeners, oldListeners) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove$1, vm);
  target = undefined;
}

```

* initRender() 初始化vm的渲染相关的属性 => _vnode, _staticTrees, $slots, $scopedSlots, _c, $createElement, $attrs, $listeners, $vnode

```
function initRender (vm) {

  vm._vnode = null; 
  vm._staticTrees = null; 
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; 
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;

  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { 
    return createElement(vm, a, b, c, d, false); 
  };

  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);

    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);

  }
}
```

```
function resolveSlots (children, context) {
  var slots = {};
  if (!children) {
    return slots
  }

  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}
```

* callHook(vm, 'beforeCreate'); 

```

function callHook (vm, hook) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget();
  var handlers = vm.$options[hook];
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm);
      } catch (e) {
        handleError(e, vm, (hook + " hook"));
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

```

* initInjections()

```
function initInjections (vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(function (key) {
      /* istanbul ignore else */
      {
        defineReactive(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      }
    });
    toggleObserving(true);
  }
}
```

* initState() => 初始化vm的属性： _watchers

```

function initState (vm) {
  vm._watchers = [];
  var opts = vm.$options;

  if (opts.props) { initProps(vm, opts.props); }

  if (opts.methods) { initMethods(vm, opts.methods); }

  if (opts.data) {
    initData(vm);    // 使用用户传入的data，即vm.$options.data来初始化
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }

  if (opts.computed) { initComputed(vm, opts.computed); }

  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

```

```
function initProps (vm, propsOptions) {

  var propsData = vm.$options.propsData || {};
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }
  
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);

    /* istanbul ignore else */
    {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive(props, key, value, function () {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);  // 将vm['_props'][key]直接代理到vm.key
    }
  };

  for (var key in propsOptions) loop( key );

  toggleObserving(true);
}
```

```
// 将vm.options.methods直接代理到vm的属性上
function initMethods (vm, methods) {

  var props = vm.$options.props;
  for (var key in methods) {
    {
      if (methods[key] == null) {
        warn(
          "Method \"" + key + "\" has an undefined value in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm);
  }
}
```

```
function initData (vm) {

  var data = vm.$options.data;

  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};

  if (!isPlainObject(data)) {
    data = {};
    "development" !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;

  while (i--) {
    var key = keys[i];
    {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      "development" !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {    

      proxy(vm, "_data", key);      // 将vm['_data'][key]直接代理到vm.key
      console.log('代理后的vm:');
      console.log(vm);
    }
  }
  observe(data, true /* asRootData */);  
}
```

```
function initComputed (vm, computed) {

  var watchers = vm._computedWatchers = Object.create(null);
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if ("development" !== 'production' && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}
```

```
function initWatch (vm, watch) {

  for (var key in watch) {
    var handler = watch[key];

    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (vm, expOrFn, handler, options) {

  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }

  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options)  
}
```

* initProvide()

```

function initProvide (vm) {

  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}
```
*  callHook(vm, 'created'); 

*  初始化vm._name

```
if ("development" !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false);
    mark(endTag);
    measure(("vue " + (vm._name) + " init"), startTag, endTag);
}

```

* 初始化vm.$el

```

// 当vm.$options.el存在的时候，生命周期才进入 beforeMount和mounted
if (vm.$options.el) {
    vm.$mount(vm.$options.el);  
}
```

```
Vue.prototype.$mount = function (el, hydrating) {

  el = el && inBrowser ? query(el) : undefined;   
  return mountComponent(this, el, hydrating)
};
```

#### 执行this._init()之后Vue实例vm （this）:
```
Vue {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …}
$attrs
$children
$createElement
$el
$listeners
$options
$parent
$refs
$root
$scopedSlots
$slots
$vnode
_c
_data
_directInactive
_events
_hasHookEvent
_inactive
_isBeingDestroyed
_isDestroyed
_isMounted
_isVue
_renderProxy
_self
_staticTrees
_uid
_vnode
_watcher
_watchers
$data
$isServer
$props
$ssrContext
get $attrs
set $attrs
get $listeners
set $listeners
__proto__

```

```
vm.__proto__ === Vue.prototype;  // true
```