#### vue中封装的工具函数


* looseEqual() => Vue.prototype._q => vm._q

```
// 比较a和b是否相等，注意引用对象之间的比较： 数组和纯对象
function looseEqual (a, b) {

  if (a === b) { return true }
  
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);

  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])   // 递归
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}
```

* looseIndexOf() => Vue.prototype._i => vm._i

```
// 找出数组arr中值等于val的索引
function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

```

* toNumber() => Vue.prototype._n => vm._n
```
// 将值转换成为number数值类型，如果转换失败，返回原始值。
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

```

* toString() => Vue.prototype._s => vm._s
```
// 将值转换成字符串类型
function toString (val) {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

```

* hasOwn()

```
// 判断是对象自身属性，而不是来自于原型链
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}
```

* hasProto

``` 
var hasProto = '__proto__' in {};
```

* no()

```
// 函数总返回false
var no = function (a, b, c) { return false; };

```

* identity()

```
// 函数入参是什么，就返回什么
var identity = function (_) { return _; };

```

* 浏览器环境

```

var inBrowser = typeof window !== 'undefined';     // 判断如果window存在，则inBrowser为true
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;


```

* Object.freeze({})

```
// 不可以再添加新属性
var emptyObject = Object.freeze({});
```

* isPrimitive()

```
// 是否是基本数据类型
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
```

* isUndef()

```
function isUndef (v) {
  return v === undefined || v === null
}
```

* isDef()

```
function isDef (v) {
  return v !== undefined && v !== null
}
```

* isTrue()

```
// 判断真值，严格等于true
function isTrue (v) {
  return v === true
}
```

* isFalse()

```
// 判断假值，严格等于false
function isFalse (v) {
  return v === false
}
```

* isPlainObject()

```

// obj是纯对象的时候，返回true
var _toString = Object.prototype.toString;
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

```
* isRegExp()

```
// v是正则的时候，返回true
function isRegExp (v) {
  return _toString.call(v) === '[object RegExp]'
}
```

* toRawType()

```
// 获取值的原始类型字符串
var _toString = Object.prototype.toString;
function toRawType (value) {
  return _toString.call(value).slice(8, -1)   // 从第八位到倒数第二位
}
例如： toRawType('hello')，返回"String"
```

* isObject()

```
// 判断是否是引用类型，主要是用来区分object类型和基本数据类型
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}
```

* cached()

```
// 利用纯函数fn来实现缓存
function cached (fn) {
  var cache = Object.create(null);  // 缓存初始化为空对象
  return (function cachedFn (str) {
    var hit = cache[str];      // 因为纯函数只依赖输入，所以这边可以使用输入当做Key
    return hit || (cache[str] = fn(str))  // 如果缓存中有，则取缓存中的结果，否则赋值给缓存相应的key，并返回。
  })
}
```

* once()

```
// 确保函数只执行一次
function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}
```

* isReserved()

```

// 是否是保留字，以$或者_开头
// 0x24在ASCII码表中是$,  0x5F是_
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

```

* makeMap()

```
// 根据输入的字符串str建立一个map，其中str约定以逗号分隔， 返回一个根据入参来对map取值的函数
// 例如： 执行makeMap('key,ref,slot,slot-scope,is')，则生成map {key: true, ref: true, slot: true, slot-scope: true, is: true}
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);   // 空对象
  var list = str.split(','); 
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }

  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}
调用：
var isPlainTextElement = makeMap('script,style,textarea', true);
isPlainTextElement('style');    // true
isPlainTextElement('div');      // undefined, 因为map中没有相应的key

```

* isHTMLTag()

```
// 方便判断字符串是否是html标签
var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);
```

* isReservedTag()

```
// 参数tag是否是保留字
var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

Vue.config.isReservedTag = isReservedTag;

```

* isBuiltInTag()

```
// 检查是否是内置标签
var isBuiltInTag = makeMap('slot,component', true);

```

* isReservedAttribute()

```
// 检查属性是否是保留属性
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

```

* genStaticKeys()

```
function genStaticKeys (modules) {

  return modules.reduce(function (keys, m) {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

genStaticKeys(modules$1);

```

* genStaticKeys$1() => 静态属性生成的map => 在optimize优化AST的时候用到

```

function genStaticKeys$1 (keys) {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
    (keys ? ',' + keys : '')
  )
}

var genStaticKeysCached = cached(genStaticKeys$1);

```

* isNative()

```
// 是否是原生的函数 => 打印原生函数，会有native code的字符串标志
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}
```

* hasSymbol

```
var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

```

* _Set

```
// ES6的Set，没有则实现一个Set polyfill
var _Set;
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {

    function Set () {
      this.set = Object.create(null);
    }

    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };

    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };

    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;

  }());
}
```

* repeat()

```
// 字符串str重复n次
 var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

```

* query()

```
// 查询el，el可以是字符串，可以是dom对象：
// 如果传入字符串，则直接querySelector返回；如果没有找到，则返回一个新创建的div空对象
// 如果传入对象，则直接返回对象
function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);    // 形如：document.querySelector('div#app'), 得到dom对象
    if (!selected) {
      process.env.NODE_ENV !=='production' && warn(
        'Cannot find element: ' + el
      );
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
```

* sharedPropertyDefinition

```
// vue中多次使用了noop，一般用做callback的函数，如果传入noop，表示什么都不做
function noop (a, b, c) {}

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};


/* 此处修改Object,defineProperty配置属性 */

Object.defineProperty(obj, key, sharedPropertyDefinition);
```

* proxy()

```
// 将原本target[sourceKey][key], 代理到target[key]
function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

调用： proxy(vm, "_data", key);   // 将vm["_data"][key]属性代理到 vm[key], 之后改变vm.key, 就可以直接触发视图的更新

```

* def()

```
// 在对象obj上定义属性key，value是val，第四个参数enumerable是否可枚举
// 如果第四个参数不传，则表示该属性不可枚举
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}
```

* extend() => 扩展第一个参数的对象属性

```
// 在to对象里添加_from对象没有的，但是如果两者共有的，则to里相应key的值会被_from的值覆盖
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}
```

* isValidArrayIndex()

```
// 检查val是否是有效的数组下标
function isValidArrayIndex (val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}
```


* toArray()

```
// 类数组对象list转换成真正的数组，从索引start开始
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}
```

* toObject()

```
// 将对象数组合并成一个新的对象， 后面的对象会覆盖前面对象的属性
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

调用： 例如： var o = [{a: 1, b : 2}, {a: 11, c: 3}]; 结果是： {a: 11, b: 2, c: 3}
```

* remove()

```
// 从数组arr中删除值是item的一项
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

调用： remove(this.subs, sub);   // dep对象从this.subs数组中移除Watcher对象sub

```

* trigger()

```
// 自定义事件type, el触发事件
function trigger (el, type) {
  var e = document.createEvent('HTMLEvents');   // 创建事件， e 就是被创建的 Event 对象
  e.initEvent(type, true, true);    // 定义事件名为type
  el.dispatchEvent(e);    //  触发对象el可以是任何元素或其他事件目标
}
```

* camelize()

```
var camelizeRE = /-(\w)/g;    // -后面紧跟着的字符，变成大写字母
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

例如: camelize('df-abcd-eee')  结果是："dfAbcdEee"

```

* hyphenate()

```
// 将首字母大写，变成-小写字母
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

例如： hyphenate("dfAbcdEee")  结果是："df-abcd-eee"
```

* capitalize() 

```
// 首字母大写
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});
```

* bind

```
// 如果不存在bind函数，自己实现的bind
function polyfillBind (fn, ctx) {

  function boundFn (a) {

    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length;
  return boundFn
}

// 原生bind
function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

var bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind;

```

* stringifyObject()

```
// 获得所有的key值的字符串
function stringifyObject (value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) { res += ' '; }
      res += key;
    }
  }
  return res
}

```
* concat()
```

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}
```

* stringifyClass()

```
function stringifyClass (value) {
  if (Array.isArray(value)) {       // 数组
    return stringifyArray(value)
  }
  if (isObject(value)) {             // 对象
    return stringifyObject(value)
  }
  if (typeof value === 'string') {   // 字符串
    return value
  }
  /* istanbul ignore next */
  return ''                          // 其余类型return空字符串
}
```

* stringifyArray()

```
function stringifyArray (value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) { res += ' '; }
      res += stringified;
    }
  }
  return res
}
```

* sameVnode() => 遍历新旧虚拟dom树，来查找是否是相同的VNode节点，

```
// 是否是相同的vNode节点
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}


```

* isTextInputType

```
var isTextInputType = makeMap('text,number,password,search,email,tel,url');

```
* sameInputType()

```
// input节点的比较，是否是同一种类型的input

function sameInputType (a, b) {
  if (a.tag !== 'input') { return true }
  var i;
  var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

```

* genNode()

```
function genNode (node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}
```

* getOuterHTML()
```
// new Vue()没有传入render字段，也没有传入template字段，只能根据el字段来生成模板字符串
// 函数作用： 根据el返回它自己的Html字符串，如果没有则内部创建
function getOuterHTML (el) {
  if (el.outerHTML) {
    return el.outerHTML       
  } else {
    var container = document.createElement('div');
    container.appendChild(el.cloneNode(true));
    return container.innerHTML
  }
}
```

* parsePath()

```
// 解析点分隔的字符串
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}
```

* 防止滚动时的卡顿： passive设为true来告诉浏览器，事件处理程序不会调用preventDefault来阻止默认行为

```
var supportsPassive = false;
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
        supportsPassive = true;
      }
    })); 

    window.addEventListener('test-passive', null, opts);

  } catch (e) {

  }
}

```

* devtools

```
// 获取浏览器中的devtools插件
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

```

* warn() => 控制台打印warnning： [Vue warn]

```
var hasConsole = typeof console !== 'undefined';

var warn = function (msg, vm) {
  var trace = vm ? generateComponentTrace(vm) : '';

  if (config.warnHandler) {
    config.warnHandler.call(null, msg, vm, trace);
  } else if (hasConsole && (!config.silent)) {
    console.error(("[Vue warn]: " + msg + trace));
  }
};

```

* tip() => 控制台打印warnning： [Vue tip]
```
var tip = function (msg, vm) {
  if (hasConsole && (!config.silent)) {
    console.warn("[Vue tip]: " + msg + (
      vm ? generateComponentTrace(vm) : ''
    ));
  }
};

```

* formatComponentName() => 打印错误日志的时候，格式化组件名
```
var classifyRE = /(?:^|[-_])(\w)/g;

var classify = function (str) { 
  return str.replace(classifyRE, 
    function (c) { return c.toUpperCase(); 
    }).replace(/[-_]/g, ''); 
};

var formatComponentName = function (vm, includeFile) {

  if (vm.$root === vm) {
    return '<Root>'
  }

  var options = typeof vm === 'function' && vm.cid != null
    ? vm.options
    : vm._isVue
      ? vm.$options || vm.constructor.options
      : vm || {};

  var name = options.name || options._componentTag;

  var file = options.__file;

  if (!name && file) {
    var match = file.match(/([^/\\]+)\.vue$/);
    name = match && match[1];
  }

  return (
    (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
    (file && includeFile !== false ? (" at " + file) : '')
  )
};

```

* generateComponentTrace() => 打印错误堆栈的结构： 从上往下依次是由子组件到父组件

```
/**
  * 根据viewModel的$parent属性找到父组件，然后组织栈的结构，从上往下依次是由子组件到父组件
  * 打印错误堆栈
  * 例如： 

  vue.runtime.esm.js:574 [Vue warn]: Error in render: "TypeError: Cannot read property 'relativeUrl' of undefined"

  found in

  ---> <DetailBanner> at xxx\detail.banner.vue
        <Detail> at xxx\detail.vue
          <Root>

*/
  
var generateComponentTrace = function (vm) {

  if (vm._isVue && vm.$parent) {
    var tree = [];
    var currentRecursiveSequence = 0;

    // 从vm开始沿着$parent指针一直向数组tree中push父组件，直到根，即没有父组件
    while (vm) {
      if (tree.length > 0) {
        var last = tree[tree.length - 1];
        if (last.constructor === vm.constructor) {
          currentRecursiveSequence++;
          vm = vm.$parent;
          continue
        } else if (currentRecursiveSequence > 0) {
          tree[tree.length - 1] = [last, currentRecursiveSequence];
          currentRecursiveSequence = 0;
        }
      }
      tree.push(vm);
      vm = vm.$parent;
    }

    // 从子组件开始打印错误堆栈
    return '\n\nfound in\n\n' + tree
      .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
          ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
          : formatComponentName(vm))); })
      .join('\n')
  } else {
    return ("\n\n(found in " + (formatComponentName(vm)) + ")")
  }
}

```

* handleError()

```

function handleError (err, vm, info) {

  if (vm) {
    var cur = vm;
    while ((cur = cur.$parent)) {
      var hooks = cur.$options.errorCaptured;
      if (hooks) {
        for (var i = 0; i < hooks.length; i++) {
          try {
            var capture = hooks[i].call(cur, err, vm, info) === false;
            if (capture) { return }
          } catch (e) {
            globalHandleError(e, cur, 'errorCaptured hook');
          }
        }
      }
    }
  }
  globalHandleError(err, vm, info);
}
```

* globalHandleError()

```
function globalHandleError (err, vm, info) {

  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      logError(e, null, 'config.errorHandler');
    }
  }
  logError(err, vm, info);
}
```

* logError()
```

function logError (err, vm, info) {

  {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}
```