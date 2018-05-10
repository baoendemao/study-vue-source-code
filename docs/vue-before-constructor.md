#### 全局初始化，即在进入Vue构造函数之前做了哪些工作
* 初始化Dep构造函数
* 初始化vNode
* 初始化Observer
* 初始化各种map, makeMap()
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
* 初始化生命周期，lifecycleMixin()
* renderMixin()
* installRenderHelpers()
* initGlobalAPI()
* initUse()
* 初始化Vue.config
* 