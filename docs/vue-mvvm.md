#### MVVM
* 从Vue构造函数进入

```
// options是new vue(options)从外面传过来的对象参数
function Vue (options) {  

  // 如果不是生产环境， 且this不是Vue的实例，即不是通过new Vue的方式创建的this
  if (process.env.NODE_ENV !=='production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

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
    // _isComponent在创建组件时为true
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      // 首次会进入else分支
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
    initData(vm);    // 使用外边传入的data，即vm.$options.data来初始化
  } else {
    // 如果外边没有传入data属性，则observe一个空对象
    // 并将这个空对象赋值给vm._data
    observe(vm._data = {}, true /* asRootData */);
  }

  if (opts.computed) { initComputed(vm, opts.computed); }

  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

```

* 初始化data => 递归的将data变为可被观察的 => 之后添加的新属性不会变成响应式的，因为新添加的属性没有被observe, 没有被重新设置Object.defineProperty()的get和set。如果想要新添加的属性变成响应式的，需要通过this.$set()显示设置。

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

      // 不允许methods中定义和data相同的key
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }

    }

   
    if (props && hasOwn(props, key)) {

      // 不允许data中定义和props相同的key
      process.env.NODE_ENV !=='production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {  // data里的属性不可以是保留字

      // 将属性代理到vm，
      // 即如果用户传入的data有个属性是count, 原本可以访问vm._data.count，现在可以直接vm.count访问data里的属性，即this.count
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

* observe()  走进MVVM => 监听的参数value必须是object类型，即数组或者纯对象 => 监听的标志: __ob__ => new Observer() => defineReactive() => Object.defineProperty()

```
// 将value变成可被观察的, 返回与其相关的Observer对象
// 第二个参数表示是否是根
function observe (value, asRootData) {
   
  // 只能观察对象(纯对象和数组)，且除了VNode对象之外的
  if (!isObject(value) || value instanceof VNode) {
    return
  }

  // 最后return的Observer对象
  var ob;

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {

    // 如果value已经含有__ob__属性，则说明已经被观察过了，直接return __ob__， 保证不会重复绑定新的Observer实例
    ob = value.__ob__;

  } else if (shouldObserve &&             // shouldObserve: 表示是否允许观察此数据value
      !isServerRendering() &&             // 非服务器端渲染才允许观察此数据value
      (Array.isArray(value) || isPlainObject(value)) &&    // 当value是数组或者纯对象的时候，才允许观察
      Object.isExtensible(value) &&       // 对象可扩展，才允许观察
      !value._isVue) {                    // _isVue是用来标志避免观察Vue自身

    // 针对对象和数组的MVVM
    // 通过new Observer，使得value变成可被观察的：value对象里多了_ob_属性, value对象的每个属性都多了get/set方法
    ob = new Observer(value);   

  }
 
  // 根对象的vmCount > 0
  if (asRootData && ob) {
    ob.vmCount++;
  }

  return ob
}

```

* Observer => 深度递归的将数据value变为可被观察的，被监听 => 将当前new的Observer实例this添加到参数value的属性__ob__上

```
// new Observer()只传入一个参数，即数据value
// 使得value(纯对象或数组)变为可被观察的，在其上添加__ob__属性，值是new出的Observer实例
// 如果value是对象，则深度递归处理value的每个属性值变为可被观察的
// 如果value是数组，则通过重新定义数组的7个方法，使得数组是可被观察的，然后递归处理数组的每个元素变为可被观察的
var Observer = function Observer (value) {

  this.value = value;     // __ob__.value指向value对象自身

  // 新建Dep实例，__ob__.dep
  // Vue的data增加和删除新属性的时候，用来依赖收集的。如Vue.set和Vue.delete
  this.dep = new Dep();   

  this.vmCount = 0;       // __ob__.vmCount
    
  // value对象上新加属性_ob_, 值是当前new出来的this，即Observer实例自身
  // def()函数的第四个参数不传递，表示该属性__ob__是不可枚举的，之后遍历value，就不会遍历到__ob__属性
  def(value, '__ob__', this);    

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

  // 遍历obj的属性。其中__ob__不会被观察，因为它是不可枚举的，且不会轻易去改变__ob__，不需要去观察__ob__属性
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);   // 使得obj的属性keys[i]变成可被观察的
  }
};

```

defineReactive() => 递归的将obj[key]变为可被观察的 => 添加__ob__属性，值为new 出来的新的Observer实例
=> 注意obj[key]必须是数组或者纯对象，因为对于基本数据类型，是不会被观察的，不会被添加__ob__属性的
```
//  使用Object.defineProperty对obj对象绑定被观察属性key，值是val
// 第五个参数shallow表示是否要深度变为可观察的。如果为true，则不深度递归。如果为false，则深度观察
function defineReactive (obj, key, val, customSetter, shallow) {

  // 闭包到下面的get和set中， 每个将要被观察的属性obj[key]都有唯一的dep
  // 用于依赖收集
  var dep = new Dep();

  // 获取obj[key]的每个属性描述符
  var property = Object.getOwnPropertyDescriptor(obj, key);  

  // 如果该属性不可配置，直接return 
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;    // 取出之前定义的get

  // arguments.length等于2, 说明没有传递val
  // 且如果属性没有get方法，则直接获取属性对应key的值
  if (!getter && arguments.length === 2) {  
    val = obj[key];
  }

  var setter = property && property.set;    // 取出之前定义的set

  // 对obj[key]进行递归被观察（凡是其属性，属性的属性，属性的属性的属性...， 都依次被观察，添加__ob__属性）childOb的值为new 出来的新的Observer实例
  var childOb = !shallow && observe(val);   

  // 响应式的关键
  Object.defineProperty(obj, key, {
    // 可枚举
    enumerable: true,  
    // 可配置
    configurable: true,

    // 读的时候，触发reactiveGetter()方法
    get: function reactiveGetter () {

      // 取值就是为了获取value
      var value = getter ? getter.call(obj) : val;  // 如果属性原本有get方法，则执行获取value

      // 只有Dep.target存在时, 表明需要进行依赖收集
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

    // 数据劫持：写的时候，触发reactiveSetter()方法
    set: function reactiveSetter (newVal) {

      // getter获取旧的值
      var value = getter ? getter.call(obj) : val;

     // 如果新值和旧的值是相等的，说明没有变，不需要处理，不需要触发依赖
     // 同样，针对NaN !== NaN, 也不需要处理
      if (newVal === value || (newVal !== newVal && value !== value)) {   
        return
      }

      // customSetter是此函数的第四个参数
      if (process.env.NODE_ENV !=='production' && customSetter) {
        customSetter();
      }

      if (setter) {

        // 如果属性原本有set，则执行原来的set，来保证原来的设置不受影响
        setter.call(obj, newVal);    

      } else {

        // 如果原本没有set，则直接复制
        val = newVal; 

      }

      childOb = !shallow && observe(newVal);  // 新值需要可以被观察, 来实现深度观察

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
    // def()函数的第四个参数不传递，表示该属性key是不可枚举的，之后遍历target，就不会遍历到key属性
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

  // 缓存数组的原生方法
  var original = arrayProto[method];  

  // 在arrayMethods上重写这7个方法，不会污染原生数组，同时拦截
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
    return result;
  });
});

// getOwnPropertyNames() : 获取对象的属性名字数组
// arrayKeys是：["push", "pop", "shift", "unshift", "splice", "sort", "reverse"]
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

```



* 订阅者Dep => 发布订阅模式 => <br/>
(1）管理内部成员变量数组subs，操作为添加删除其中的某一项 <br/>
(2) subs是一个观察者数组
(3) 当数据改变的时候，notify subs数组中的所有观察者对象，并调用subs[i]的update方法

```

var Dep = function Dep () {
  this.id = uid++;      // dep对象的唯一标识 => Watcher添加dep的时候，保证不重复添加dep
  this.subs = [];       // 存放 (观察者Watcher对象)。
};

// 添加观察者
Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);    // push Watcher对象
};

// 移除观察者
Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);   
};

// 依赖收集, 即收集观察者
// Watcher.prototype.addDep()。 Dep.target是全局的, 这里将当前的Dep实例添加到当前处理的Watcher的newDeps中
// 当前的Dep实例是在defineReactive()中，针对每个要监听的属性obj[key]都new出来了唯一的Dep实例
Dep.prototype.depend = function depend () {
  if (Dep.target) {   
    Dep.target.addDep(this);   // Watcher addDep的同时，在被添加的dep的subs数组中push该watcher, 即dep和watcher对应关系：一个watcher可能存在于多个dep中 => 一个对象改变，通知所有与之相依赖的视图都要更新；一个dep会存放多个watcher => 一个对象改变，可能会触发多个视图的更新
  }
};

// 触发响应
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

    // e有__ob__属性，说明e是一个对象或者数组 
    e && e.__ob__ && e.__ob__.dep.depend();

    // 如果数组的某个元素也是一个数组，则需要dependArray来收集依赖
    if (Array.isArray(e)) {
      dependArray(e);
    }

  }
}

```

* 观察者Watcher => new Watcher()触发Watcher.prototype.get() => 将当前Watcher实例赋值给Dep.target。 <br/>
一共有三次会new Watcher实例： <br/>
<1> this.$watch() <br/>
<2> mountComponent() <br/>
<3> initComputed()

```
// expOrFn: 要观察的表达式
// cb: 表达式的值变化的时候的回调函数
// isRenderWatcher: 是否是渲染watcher
var Watcher = function Watcher (vm, expOrFn, cb, options, isRenderWatcher) {

  // 表明当前watcher归属于哪个Vue实例
  this.vm = vm;

  // 是否是渲染watcher
  if (isRenderWatcher) {
    vm._watcher = this;
  }

  vm._watchers.push(this);

  if (options) {
    this.deep = !!options.deep;   // 是否深度观察
    this.user = !!options.user;   
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }

  this.cb = cb;         // new Watcher的第三个参数，callback。当数据变化的时候，就是传入的这个函数来改变的视图。

  this.id = ++uid$1;    // uid for batching。id用来区分不同的Watcher，防止被重复放入watcher队列中。
  this.active = true;   // true：表示当前watcher实例是激活的
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();   // 避免收集重复依赖
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();

  // parse expression for getter
  // getter属性是一个函数
  if (typeof expOrFn === 'function') {

    // 如果expOrFn是一个函数，则直接赋值
    this.getter = expOrFn;

  } else {

    // 将expOrFn字符串表达式转换为函数
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

  // 将当前的Watcher实例赋值给Dep.target，即Watcher自己
  pushTarget(this);  

  // 最后返回的值
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

// render渲染视图 => 调用callback，该callback是在new Watcher的时候传入的参数
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
    (isUndef(target) || isPrimitive(target))      // isPrimitive()：是否是基本数据类型
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
    (isUndef(target) || isPrimitive(target))    // isPrimitive()：是否是基本数据类型
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

  // 如果key不是target对象的属性，则不需要删除，直接return
  if (!hasOwn(target, key)) {
    return
  }

  // 删除target对象上的属性key
  delete target[key];

  // 因为删除了属性key，有变化，所以需要触发响应式依赖
  // 如果target上的Observer不存在，触发不了响应式依赖, 则直接返回
  if (!ob) {
    return
  }

  // 如果target上的Observer存在，则触发响应式依赖
  ob.dep.notify();
}

Vue.prototype.$delete = del;

Vue.delete = del;

```

* shouldObserve => 数据是否可以被观察

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