* 从Vue构造函数进入Vue.prototype._init，参数options怎么初始化的


```
Vue.prototype._init = function (options) {
    var vm = this;   

    /* 省略代码 */
    vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
    );
    /* 省略代码 */

    initState(vm); 
}

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
// value即vm["_data"]
function observe (value, asRootData) {

  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 返回Observer对象ob，并且value对象里多了_ob_属性, value对象的每个属性都多了get/set方法
    ob = new Observer(value);   
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

```

* 

```
// 观察者构造函数
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;   
    

  def(value, '__ob__', this);    // value对象上新加属性_ob_, 即vm["_data"]上新加了属性__ob__

  if (Array.isArray(value)) {
    // value如果是数组

    var augment = hasProto     
      ? protoAugment    
      : copyAugment;    
    augment(value, arrayMethods, arrayKeys);

    this.observeArray(value);
  } else {
    // value如果是对象

    this.walk(value);
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
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {

  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);

  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  if (!getter && arguments.length === 2) {
    val = obj[key];
  }
  var setter = property && property.set; 

  var childOb = !shallow && observe(val);

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
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
                /*如果原本对象拥有setter方法则执行setter*/
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}  
```