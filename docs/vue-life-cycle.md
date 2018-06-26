#### Vue实例的生命周期
LIFECYCLE_HOOKS定义([源码点这里](https://github.com/vuejs/vue/blob/dev/src/shared/constants.js))

    ```
    export const LIFECYCLE_HOOKS = [
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
    ]
    ```
* 在Vue实例初始化的时候经历从beforeCreate => created => beforeMount => mounted
* 在data更新的时候，从beforeUpdate => updated

#### 生命周期的过程
[声明周期流程图点这里](https://github.com/baoendemao/study-vue-source-code/blob/master/images/lifecycle.png)

再来看一下代码，继续从入口_init()开始：

```

  Vue.prototype._init = function (options) {
    var vm = this;

    // a uid
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

    callHook(vm, 'beforeCreate');   // 注意：在此代码之前做了什么

    initInjections(vm); // resolve injections before data/props

    initState(vm);
    
    initProvide(vm); // resolve provide after data/props

    callHook(vm, 'created');        // 注意：在此代码之前做了什么

    /* istanbul ignore if */
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    // 当vm.$options.el存在的时候，生命周期才进入 beforeMount和mounted
    if (vm.$options.el) {   
      vm.$mount(vm.$options.el);
    }
  };


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