#### MVVM
* 从Vue构造函数进入

```
function Vue (options) {  
  if ("development" !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);
}

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

// 初始化props, methods, data, computed, watch
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

* 初始化data

```
function initData (vm) {

  var data = vm.$options.data;

  // 注意： 此处将用户传进来的data赋值给了vm._data，
  // 后面将会把data里的每个属性代理到vm上, 细节请看proxy函数
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};       

  // 用户传入的data必须是一个JS对象
  if (!isPlainObject(data)) {
    data = {};
    "development" !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance    
  var keys = Object.keys(data);   // 得到data里的属性数组
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;

  // 遍历data
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

    // props属性不可以和data的属性重复
    if (props && hasOwn(props, key)) {
      "development" !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {  // data里的属性不可以是保留字

      // 将属性代理到vm，
      // 即如果用户传入的data有个属性是count, 原本可以访问vm._data.count，现在可以直接vm.count访问data里的属性
      proxy(vm, "_data", key); 
    }
  }
  // observe data
  observe(data, true /* asRootData */);   // 开始观察者
}
```

* 代理函数proxy()

```
// 将原本this[sourceKey][key], 代理到target[key]
function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

调用： proxy(vm, "_data", key);   // 将vm["_data"][key]属性代理到 vm[key]
```

* observe()  走进MVVM

```
// 对value进行MVVM, 返回与对象相关的Observer对象
function observe (value, asRootData) {
   
  // 只能观察对象(纯对象和数组)，且除了VNode对象之外的
  if (!isObject(value) || value instanceof VNode) {
    return
  }

  var ob;

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {

    // 如果value已经含有__ob__属性，则说明已经被观察过了，直接return ob
    ob = value.__ob__;

  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 针对对象和数组的MVVM
    // 返回Observer对象ob，并且value对象里多了_ob_属性, value对象的每个属性都多了get/set方法
    ob = new Observer(value);   
  }

  if (asRootData && ob) {
    ob.vmCount++;
  }

  return ob
}

```

* Observer

```
// value是要被观察的数据
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();   
  this.vmCount = 0;   
    

  def(value, '__ob__', this);    // value对象上新加属性_ob_, 值是当前的Observer实例

  if (Array.isArray(value)) {
    // value如果是数组，借用Array.prototype来对数组进行MVVM

    var augment = hasProto     
      ? protoAugment    
      : copyAugment;    

    augment(value, arrayMethods, arrayKeys);

    this.observeArray(value);

  } else {
    // value如果是对象, 直接使用Object.defineProperty对每个属性监听

    this.walk(value);
  }
};
```

```
// 遍历数组的每个元素
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};
```

```
// 遍历obj对象的每一个属性进行绑定
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

```



```
//  使用Object.defineProperty对obj对象绑定被观察属性key，值是val
function defineReactive (obj, key, val, customSetter, shallow) {

  // 闭包到下面的get和set中， 每个将要被观察的属性obj[key]都有唯一的dep
  var dep = new Dep();

  // 获取obj[key]的每个属性描述符
  var property = Object.getOwnPropertyDescriptor(obj, key);  

  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;    // 取出之前定义的get
  if (!getter && arguments.length === 2) {
    val = obj[key];
  }
  var setter = property && property.set;    // 取出之前定义的set

  var childOb = !shallow && observe(val);   // 对obj[key]进行递归绑定

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,

    // 读的时候，触发reactiveGetter()方法
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;  // 如果属性原本有get方法，则执行获取value

      // 只有在有Dep.target时, 才进行依赖收集
      if (Dep.target) {
        dep.depend();          // 将watcher添加到dep的subs数组中
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },

    // 写的时候，触发reactiveSetter()方法
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ("development" !== 'production' && customSetter) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);    // 如果属性原本有set，则执行原来的set
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);  // 对新值进行监听
      dep.notify();        // 通知所有的观察者watcher
    }
  });
}  
```

* 数组的MVVM

```
// 针对Keys中的每个元素key, 在对象target上添加该key，值是src[key]
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}
```

```
// 直接在原型上修改， Vue中对数组的MVVM是通过Array.prototype上的操作数组的方法
function protoAugment (target, src, keys) {
  target.__proto__ = src;
}
```

```
// 原生数组的原型
var arrayProto = Array.prototype;

// 创建一个对象，原型是Array.prototype
// 该对象可以访问原生数组原型上的所有函数和属性
var arrayMethods = Object.create(arrayProto);

// 通过重写这7个方法，实现对数组的MVVM
var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach(function (method) {
  // cache original method，  
  var original = arrayProto[method];  // 原生方法

  // 在arrayMethods上重写这7个方法，不会污染原生数组
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args); 

    var ob = this.__ob__;
    var inserted;

    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }

    // 如果数组中插入了新元素，则对新元素observe
    if (inserted) { ob.observeArray(inserted); }

    // notify change
    ob.dep.notify();
    return result
  });
});

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

```



* 订阅者Dep

```

var Dep = function Dep () {
  this.id = uid++;      // dep对象的唯一标识
  this.subs = [];       // 存放观察者Watcher对象
};

// 添加观察者
Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);    // push Watcher对象
};

// 移除观察者
Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);   
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

// 通知每个观察者watcher
Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();   
  }
};

```


* 观察者Watcher

```

var Watcher = function Watcher (vm, expOrFn, cb, options, isRenderWatcher) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }

  vm._watchers.push(this);

  if (options) {
    this.deep = !!options.deep;   // 监听对象内部属性的改变
    this.user = !!options.user;  
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }

  this.cb = cb;
  this.id = ++uid$1; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();

  // parse expression for getter

  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      "development" !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

Watcher.prototype.get = function get () {

  pushTarget(this);  

  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm); 
  } catch (e) {

    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};


Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};


Watcher.prototype.cleanupDeps = function cleanupDeps () {

  var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};


Watcher.prototype.depend = function depend () {
  var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};


Watcher.prototype.teardown = function teardown () {

  var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

```

* Dep 依赖收集

```
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  console.log(sub instanceof Watcher)  // true
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);      // 从数组this.subs中删除sub
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {            // 注意target存在的时候才添加
    Dep.target.addDep(this);   // watcher原型上的addDep
  }
};

Dep.prototype.notify = function notify () {
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

Dep.target = null;   // Dep.target是全局的

var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { 
    targetStack.push(Dep.target); 
  }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

```

```
function queueWatcher (watcher) {

  var id = watcher.id;
  
  if (has[id] == null) {

    has[id] = true;

    if (!flushing) {

      queue.push(watcher);  

    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }

    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

```
