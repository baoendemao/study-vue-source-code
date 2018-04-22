文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

--

#### 第一步实例化Vue: new Vue({ })
首先会进入Vue的构造函数, 如下：

```
function Vue (options) {  
  if ("development" !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);
}
```

options变量来接收用户传入的实参， 实参对象里我们可以定义许多约定好的属性：el，data，computed，methods，watch，created， mounted，components等等。
从这个函数的开始大括号到结束大括号，该构造函数做了什么？ 
简单来说，就是分别处理我们传入的实参对象属性，然后在Vue.prototype上实现了很多接口方法，并且在Vue上添加了很多全局API，this上添加了很多属性。
从构造函数的函数体来看，入口就是this._init()，该方法也是在Vue.prototype原型上实现的。

#### 从最熟悉的一个属性el挂载点开始说起 (比如el: #app)
从this._init(options)进入Vue.prototype._init()函数：

```
Vue.prototype._init = function (options) {

    /* 省略代码，使用vm.$options来初始化生命周期，事件，渲染，观察者等 */

    // vm就是this, this.$options.el就是字符串'#app'
    if (vm.$options.el) {    
        vm.$mount(vm.$options.el);   
    }
}
```

$mount函数也是在Vue.prototype原型上实现的, 这里通过Vue实例调用原型链上的方法$mount

```
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && query(el);    // 通过query('div#app')函数，返回该dom节点
  
  return mountComponent(this, el, hydrating);   // 挂载组件
}

function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);       // 形如：document.querySelector('div#app')
    if (!selected) {
      "development" !== 'production' && warn(
        'Cannot find element: ' + el
      );
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

// 挂载组件，在此函数中，生命周期经历了beforeMount和mounted
function mountComponent (
  vm,
  el,
  hydrating
) {
  
  vm.$el = el;   // dom节点

  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
    {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }

  // 生命周期钩子 beforeMount
  callHook(vm, 'beforeMount');

  var updateComponent;
  /* istanbul ignore if */
  if ("development" !== 'production' && config.performance && mark) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render();
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating);
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    updateComponent = function () {
      vm._update(vm._render(), hydrating);
    };
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */);
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;           // 代表组件已经挂载

    callHook(vm, 'mounted');       // 生命周期钩子，mounted
  }
  return vm
}  

```

