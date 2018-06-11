文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

---

#### MVVM
* 从Vue构造函数进入

```
function Vue (options) {  
  if (process.env.NODE_ENV !=='production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);
}

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

    // 防止Vue实例自身被观察的标志
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
    if (process.env.NODE_ENV !=='production' && config.performance && mark) {
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

* 初始化data => 递归的将data变为可被观察的

```
function initData (vm) {

  var data = vm.$options.data;

  // 注意： 此处将用户传进来的data赋值给了vm._data，
  // 后面将会把data里的每个属性代理到vm上, 细节请看proxy函数
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};       

  // 用户传入的data必须是一个纯对象
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !=='production' && warn(
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
      process.env.NODE_ENV !=='production' && warn(
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
  observe(data, true /* asRootData */);   // data开始被观察，递归的
}
```

* 代理函数proxy()

```

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

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

* observe()  走进MVVM => 监听的参数value必须是object类型 => 监听的标志: __ob__ => new Observer() => defineReactive() => Object.defineProperty()

```
// 将value变成可被观察的, 返回与其相关的Observer对象
function observe (value, asRootData) {
   
  // 只能观察对象(纯对象和数组)，且除了VNode对象之外的
  if (!isObject(value) || value instanceof VNode) {
    return
  }

  var ob;

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {

    // 如果value已经含有__ob__属性，则说明已经被观察过了，直接return __ob__， 保证不会重复绑定新的Observer实例
    ob = value.__ob__;

  } else if (shouldObserve && !isServerRendering() && 
      (Array.isArray(value) || isPlainObject(value)) &&
      Object.isExtensible(value) && !value._isVue) {

    // 针对对象和数组的MVVM
    // 通过new Observer，使得value变成可被观察的：value对象里多了_ob_属性, value对象的每个属性都多了get/set方法
    ob = new Observer(value);   

  }

  if (asRootData && ob) {
    ob.vmCount++;
  }

  return ob
}

```

* Observer => 深度递归的将数据value变为可被观察的，被监听 => 将当前new的Observer实例this添加到参数value的属性__ob__上

```
// 使得value(纯对象或数组)变为可被观察的，在其上添加__ob__属性，值是new出的Observer实例
// 如果value是对象，则深度递归处理value的每个属性值变为可被观察的
// 如果value是数组，则通过重新定义数组的7个方法，使得数组是可被观察的，然后递归处理数组的每个元素变为可被观察的
var Observer = function Observer (value) {

  this.value = value;     // __ob__.value指向value对象自身

  this.dep = new Dep();   // 新建Dep实例，__ob__.dep

  this.vmCount = 0;       // __ob__.vmCount
    
  def(value, '__ob__', this);    // value对象上新加属性_ob_, 值是当前new出来的this

  if (Array.isArray(value)) {
    // value如果是数组，借用Array.prototype来对数组进行MVVM

    var augment = hasProto ? protoAugment : copyAugment;    

    // 将arrayMethods的相应数组的操作，赋值到value对象上
    augment(value, arrayMethods, arrayKeys);

    // 遍历数组value的每一个元素，进行observe
    this.observeArray(value);

  } else {

    // value如果是对象, 通过defineReactive()使用Object.defineProperty使得每个属性变为可被观察的
    this.walk(value);

  }
};
```

```
// 遍历数组的每个元素进行observe
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
    defineReactive(obj, keys[i]);   // 使得obj的属性keys[i]变成可被观察的
  }
};

```

defineReactive() => 递归的将obj[key]变为可被观察的 => 添加__ob__属性，值为new 出来的新的Observer实例

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

  if (!getter && arguments.length === 2) {  // 如果属性没有get方法，则直接获取属性对应key的值
    val = obj[key];
  }

  var setter = property && property.set;    // 取出之前定义的set

  // 对obj[key]进行递归被观察（凡是其属性，属性的属性，属性的属性的属性...， 都依次被观察，添加__ob__属性，值为new 出来的新的Observer实例)
  var childOb = !shallow && observe(val);   

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,

    // 读的时候，触发reactiveGetter()方法
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;  // 如果属性原本有get方法，则执行获取value

      // 只有Dep.target存在时, 才进行依赖收集
      if (Dep.target) {
        dep.depend();          // Dep.prototype.depend, dep对象是要被观察的属性obj[key]拥有的唯一的dep, 将watcher添加到dep的subs数组中，以便在值被改变的时候触发setter通知subs数组中的所有的watcher

        // childOb是obj[key].__ob__, 
        if (childOb) {
          childOb.dep.depend();  // 对值obj[key]进行依赖收集

          // value是通过属性描述符的getter获取的，如果value是数组，需要递归依赖收集
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },

    // 写的时候，触发reactiveSetter()方法
    set: function reactiveSetter (newVal) {

      // getter获取旧的值
      var value = getter ? getter.call(obj) : val;
      // 如果新值和旧的值是相等的，则不需要后面的notify
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }

      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !=='production' && customSetter) {
        customSetter();
      }

      if (setter) {
        setter.call(obj, newVal);    // 如果属性原本有set，则执行原来的set
      } else {
        val = newVal;
      }

      childOb = !shallow && observe(newVal);  // 新值需要可以被观察

      dep.notify();        // dep对象是要被观察的属性obj[key]拥有的唯一的dep， 通知所有的dep数组中的所有的观察者watcher，
    }
  });
}  

// Dep.target是全局的， 且存放唯一的Watcher实例，因为在任何时刻，当且仅当只有一个可被处理
// 收集依赖完毕之后，需要置空Dep.target, 防止重复收集依赖
Dep.target = null;  
```

* 数组的MVVM

```
// 不存在__proto__的情况：一个一个的覆盖target的属性
// 针对Keys中的每个元素key, 在对象target上添加该key，值是src[key]
// 调用： augment(value, arrayMethods, arrayKeys);
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}
```

```
// 存在__proto__的情况：直接覆盖target的__proto__
// 调用：augment(value, arrayMethods, arrayKeys);
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

    var ob = this.__ob__;   // 数组的被监听的标志和对象的一样，都是__ob__属性
    var inserted;

    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);  // splice的第三个参数是待插入的元素
        break
    }

    // 如果数组中插入了新元素，则对新元素observe
    if (inserted) { ob.observeArray(inserted); }

    // notify change
    ob.dep.notify();
    return result
  });
});

// getOwnPropertyNames() : 获取对象的属性名字数组
// arrayKeys是：["push", "pop", "shift", "unshift", "splice", "sort", "reverse"]
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

```



* 订阅者Dep => 发布订阅模式

```

var Dep = function Dep () {
  this.id = uid++;      // dep对象的唯一标识 => Watcher添加dep的时候，保证不重复添加dep
  this.subs = [];       // 存放 (观察者Watcher对象)
};

// 添加观察者
Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);    // push Watcher对象
};

// 移除观察者
Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);   
};

// 依赖收集
// Watcher.prototype.addDep()。 Dep.target是全局的, 这里将当前的Dep实例添加到当前处理的Watcher的newDeps中
// 当前的Dep实例是在defineReactive()中，针对每个要监听的属性obj[key]都new出来了唯一的Dep实例
Dep.prototype.depend = function depend () {
  if (Dep.target) {   
    Dep.target.addDep(this);   // Watcher addDep的同时，在被添加的dep的subs数组中push该watcher, 即dep和watcher对应关系：一个watcher可能存在于多个dep中 => 一个对象改变，通知所有与之相依赖的视图都要更新；一个dep会存放多个watcher => 一个对象改变，可能会触发多个视图的更新
  }
};

// 当对象改变的时候，触发Object.defineProperty的set, 通知每个观察者watcher
Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();   
  }
};

```
<br/>
dependArray() => 在Object.defineProperty的get种，对数组做依赖收集 => 调用数组元素的__ob__.dep.depend()
<br/>

```
function dependArray (value) {

  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {

    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }

  }
}

```

* 观察者Watcher => new Watcher()触发Watcher.prototype.get() => 将当前Watcher实例赋值给Dep.target <br/>
一共有三次会new Watcher实例： <1> this.$watch() <2> mountComponent() <3> initComputed()

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

  this.cb = cb;         // new Watcher的第三个参数，callback
  this.id = ++uid$1;    // uid for batching。id用来区分不同的Watcher，防止被重复放入watcher队列中。
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
      process.env.NODE_ENV !=='production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }

  this.value = this.lazy? undefined: this.get();

};

Watcher.prototype.get = function get () {

  pushTarget(this);  // 将当前的Watcher实例赋值给Dep.target

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
      dep.addSub(this);    // Dep.prototype.addSub
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

// Dep notify自己的subs数组中的所有watcher去修改相应的视图view
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

// render渲染视图 => 调用callback
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
        this.cb.call(this.vm, value, oldValue);   // 渲染操作
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

```
// targetStack是保存watcher实例的栈，因为在一个时刻只能够改变一个对象，即只能有一个watcher
var targetStack = [];       

function pushTarget (_target) {
  if (Dep.target) { 
    targetStack.push(Dep.target); 
  }
  Dep.target = _target;      // 每次new Watcher()的时候，将当前的watcher实例覆盖Dep.target全局变量
}

function popTarget () {
  Dep.target = targetStack.pop();
}

```

```
var has = {};   // 全局的，存放watcher的id的map，存在某id则对应值为true

// 观察者队列
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

* set() => 挂载到Vue.set => 全局使用

```

// Vue实例可以使用this.$set创建被可被观察的属性。
// 为什么还要用这种this.$set()的方式添加属性？ 因为实例创建之后再添加属性，新添加的属性是不会被观察的。

function set (target, key, val) {

  if (process.env.NODE_ENV !=='production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }

  // 如果target是数组，则在key索引的位置替换成val， 
  // 数组是通过在原生数组方法上修改实现响应式的，所以这里不需要trigger change notification, 所以直接return
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);      // splice函数已经实现了数组的MVVM
    return val
  }

  // 如果key已经存在, return
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }

  // 获得target对象上的Observer
  var ob = (target).__ob__;
  
  // 该响应式对象不能是Vue实例，或者Vue实例的根数据对象
  if (target._isVue || (ob && ob.vmCount)) {
   
    process.env.NODE_ENV !=='production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }

  // 如果target上的Observer不存在，则直接返回
  if (!ob) {
    target[key] = val;
    return val
  }

  // 如果target上的Observer存在，则trigger change notification
  defineReactive(ob.value, key, val);

  ob.dep.notify();

  return val
}

Vue.prototype.$set = set;

Vue.set = set;

```

* del() => 挂载到Vue.delete => 全局使用

```
// Vue实例删除属性，可以被观察到， this.$delete()
function del (target, key) {
  if (process.env.NODE_ENV !=='production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
  }

  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__;

  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !=='production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }

  if (!hasOwn(target, key)) {
    return
  }

  delete target[key];

  // 如果target上的Observer不存在，则直接返回
  if (!ob) {
    return
  }

  // 如果target上的Observer存在，则trigger change notification
  ob.dep.notify();
}

Vue.prototype.$delete = del;

Vue.delete = del;

```

* shouldObserve

```
var shouldObserve = true;

function toggleObserving (value) {
  shouldObserve = value;
}
```

* traverse()

```

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {

  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);

  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }

  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}
```