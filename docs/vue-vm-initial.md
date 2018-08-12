##### new Vue()是怎么初始化Vue实例vm (this), ( 即this._init()做的什么工作 )
* 从Vue构造函数进入

```
function Vue (options) {  
  if (process.env.NODE_ENV !=='production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);    // 调用Vue.prototype._init
}
```

* this._init()调用 => 进入Vue.prototype_init() => 初始化vm.$options, vm._isVue, vm._self, vm._uid, 生命周期，事件，渲染render, props, data, computed, methods, watch被观察，$mount

```
// 参数options是用户new Vue()传进来的对象
Vue.prototype._init = function (options) {
    var vm = this;

    vm._uid = uid$3++;    

    var startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
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
        resolveConstructorOptions(vm.constructor),   // 传入构造函数
        options || {},
        vm
      );
      
    }

    /* istanbul ignore else */
    {
      initProxy(vm);
    }
    
    // expose real self
    vm._self = vm;         // vm实例自身

    initLifecycle(vm);     // 初始化生命周期

    initEvents(vm);        // 初始化事件

    initRender(vm);        // 初始化渲染render

    callHook(vm, 'beforeCreate');    // 在生命周期beforeCreated

    initInjections(vm); 

    initState(vm);     // 初始化props/data/computed/methods/watch被观察

    initProvide(vm);   

    callHook(vm, 'created');   // 在生命周期created

    /* istanbul ignore if */
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);   // 模板的编译，渲染
    }
};
```

```
function initInternalComponent (vm, options) {

  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;
  opts._parentElm = options._parentElm;
  opts._refElm = options._refElm;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
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

function resolveModifiedOptions (Ctor) {

  var modified;
  var latest = Ctor.options;
  var extended = Ctor.extendOptions;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = dedupe(latest[key], extended[key], sealed[key]);
    }
  }
  return modified
}
```

```
function dedupe (latest, extended, sealed) {

  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    var res = [];
    sealed = Array.isArray(sealed) ? sealed : [sealed];
    extended = Array.isArray(extended) ? extended : [extended];
    for (var i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i]);
      }
    }
    return res
  } else {
    return latest
  }
}

```

```
function mergeOptions (parent, child, vm) {

  {
    // 检查child.components组件名字是否有效, 必须是字母开头，后面可以跟-
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
// 处理传入的options.props格式化成对象，并返回
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }

  var res = {};
  var i, val, name;
  
  
  if (Array.isArray(props)) {
    // 如果props属性是数组

    // 遍历数组中的每个元素，赋值给对象res作为key，value暂时初始化为{type: null}
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
    // 如果props属性是对象

    // 遍历对象中的每个属性，赋值给res作为key，如果value是对象，则作为res对应属性的value值，否则暂时初始化为{type: val}
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
// 处理options.directives成对象的形式，尤其针对函数
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
// 期望value是对象，如果不是对象则报出warnning
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
    // vm不存在

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
    // vm存在

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
<br/>
mergeData() => 将from中有的，to里没有的属性，添加到to里，且通过set()变为可被观察的
<br/>

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
      // 如果两者的值都是对象，则需要递归深度merge
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

* initProxy() => 初始化vm._renderProxy => Proxy代理对象

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

  // vm.$options.abstract是抽象组件，例如keep-alive，transition
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm); 
  }

  // 父组件
  vm.$parent = parent;
  
  // 根组件
  vm.$root = parent ? parent.$root : vm;

  // 子组件数组
  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;

  // 是否已经被挂载
  vm._isMounted = false;

  // 是否已被销毁
  vm._isDestroyed = false;

  // 是否正在被销毁
  vm._isBeingDestroyed = false;

}

```

* initEvents() 初始化vm的事件相关属性 => _events, _hasHookEvent
```
function initEvents (vm) {

  // 绑定的自定义事件
  vm._events = Object.create(null);
  vm._hasHookEvent = false;

  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
```

```
// 更新监听事件函数
// on: 新的事件对象， oldOn: 老的事件对象
function updateListeners (on, oldOn, add, remove$$1, vm) {

  var name, def, cur, old, event;

  // 遍历新的事件对象
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];

    event = normalizeEvent(name);

    /* istanbul ignore if */
    if (isUndef(cur)) {
      // 如果新的属性name对应的值不存在，则打印warnning

      process.env.NODE_ENV !=='production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      // 如果老的事件对象中不存在属性name, 则添加

      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);

    } else if (cur !== old) {
      // 如果老的事件对象中存在属性name，但是两者不相等，则更新

      old.fns = cur;
      on[name] = old;
    }
  }

  // 删除老的事件对象中有，但是新的事件对象中没有的属性
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}
```

```
function createFnInvoker (fns) {

  function invoker () {
  
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments$1);
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns;
  return invoker
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
  // 由模板编译生成的render函数所调用的生成VNode的函数
  vm._c = function (a, b, c, d) { 
    return createElement(vm, a, b, c, d, false); 
  };

  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 由外面传入的render函数调用的生成VNode的函数，和上面的vm._c有区别, 且最后一个参数不同
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

```
function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject).filter(function (key) {
        /* istanbul ignore next */
        return Object.getOwnPropertyDescriptor(inject, key).enumerable
      })
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  } 
}


```

* initState() => 初始化vm的属性： _watchers, _data， 并调用initProps和initMethods来初始化属性和方法

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

  // 初始化computed, 使得其也变成可被观察的
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
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}


function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes) {

  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}
```

```
function validateProp (key,  propOptions, propsData, vm ) {

  var prop = propOptions[key];

  var absent = !hasOwn(propsData, key);

  var value = propsData[key];
  var booleanIndex = getTypeIndex(Boolean, prop.type);   

  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value 
  if (value === undefined) {

    value = getPropDefaultValue(vm, prop, key);

    // since the default value is a fresh copy,
    // make sure to observe it.

    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}
```

```
function assertProp (prop, name, value, vm, absent) {

  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }
  if (!valid) {
    warn(
      "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', ')) +
      ", got " + (toRawType(value)) + ".",
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}
```
```

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}
```

```
function getPropDefaultValue (vm, prop, key) {
  
  // 属性没有default字段的时候，直接返回undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  if (process.env.NODE_ENV !=='production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }

  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }

  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
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
<br/>
initData() => 初始化vm._data, 通过proxy()将vm._data上的属性直接代理到了vm上， 通过observe()将data中的属性变为可被观察的
<br/>

```
function initData (vm) {

  var data = vm.$options.data;

  // data赋值给vm._data
  // 初始化传入的data通常写成一个function的形式
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};


  if (!isPlainObject(data)) {
    // 不是一个对象，则warn警告

    data = {};
    process.env.NODE_ENV !=='production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }

  var keys = Object.keys(data);   // 外部传入的data里的属性数组
  var props = vm.$options.props;
  var methods = vm.$options.methods;

  var i = keys.length;

  // 遍历data中的每一个属性
  while (i--) {
    var key = keys[i];
    {
      // data中的每一个属性不可以和methods里的属性重名
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }

    // data中的每一个属性不可以和props里的属性重名
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !=='production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {    

      // 将vm['_data'][key]直接代理到vm.key, 之后改变vm.key, 就可以直接触发视图的更新
      proxy(vm, "_data", key);      

    }
  }

  observe(data, true /* asRootData */);  
}
```

```
function getData (data, vm) {

  // #7573 disable dep collection when invoking data getters
  pushTarget();  // 将全局Dep.target清空

  try {

    return data.call(vm, vm)

  } catch (e) {

    handleError(e, vm, "data()");
    return {}

  } finally {

    popTarget();

  }
}
```

initComputed() => 初始化new Vue传入的computed属性 => 服务器端渲染的时候，禁止了响应式，避免将对象转换为响应式可被观察的性能开销

```
var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {

  var watchers = vm._computedWatchers = Object.create(null);
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];   // 用户自定义的computed的key的函数
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (process.env.NODE_ENV !=='production' && getter == null) {
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
function defineComputed (
  target,
  key,
  userDef
) {

  var shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef;
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop;
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop;
  }

  if (process.env.NODE_ENV !=='production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }

  Object.defineProperty(target, key, sharedPropertyDefinition);
}

```

```
function createComputedGetter (key) {

  return function computedGetter () {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value
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
if (process.env.NODE_ENV !=='production' && config.performance && mark) {
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
$attrs
$children => 子组件数组
$createElement
$el => 当前组件的根元素
$listeners
$options
$parent => 父组件
$refs
$root => 根组件
$scopedSlots
$slots
$vnode
_c
_data
_directInactive
_events => 绑定的自定义事件
_hasHookEvent
_inactive
_isBeingDestroyed => 正在被销毁
_isDestroyed => 是否已被销毁
_isMounted => 是否已被挂载
_isVue => 防止自身被观察
_renderProxy => Proxy对象
_self => 指向Vue实例自身
_staticTrees
_uid
_vnode
_watcher
_watchers
$data
$isServer => 是否是服务器端渲染
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