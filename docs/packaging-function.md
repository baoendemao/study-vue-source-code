文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

---

在Vue源码中，封装了很多优雅精辟的函数，本节主要介绍这些函数, 希望可以帮助更好的理解vue源码。


* looseEqual()

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

* looseIndexOf()

```
// 找出数组arr中值等于val的索引
function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

```



* markStaticNode()

```

// 标记静态节点
function markStaticNode (node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

```

* markStatic()
```
// 对以tree为根的子树，标记静态子树
function markStatic (tree, key, isOnce) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}
```
* markOnce()

```
// 标记节点为静态, 携带唯一的key
function markOnce (tree, index, key) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

```

* toNumber()
```
// 将值转换成为number数值类型，如果转换失败，返回原始值。
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

```

* toString()
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
    return hit || (cache[str] = fn(str))  // 如果缓存中有，则取缓存中的，否则赋值给缓存相应的key，并返回。
  })
}
```

* isReserved()

```
// 是否是保留字，以$或者_开头
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
var isBuiltInTag = makeMap('slot,component', true);

```

* isNative

```
// 是否是已有的函数
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
// 查询el，如果没找到，则返回一个新创建的dom元素
function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);    // 形如：document.querySelector('div#app')
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
```

* sharedPropertyDefinition

```
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

调用： proxy(vm, "_data", key);   // 将vm["_data"][key]属性代理到 vm[key]
```

* def()

```
// 在对象obj上定义属性key，value是val，enumerable是否可枚举
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}
```

* extend()

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
// 从数组arr中删除item
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

调用： remove(this.subs, sub);   // dep对象从subs中移除Watcher对象sub
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

* set()

```
function set (target, key, val) {

  if ("development" !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }

  // 如果target是数组，则在key索引的位置替换成val， 
  // 数组是通过在原生数组方法上修改实现响应式的，所以这里不需要trigger change notification, 所以直接return
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }

  // 如果key已经存在, return
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }

  // 获得target对象上的Observer
  var ob = (target).__ob__;
  
  if (target._isVue || (ob && ob.vmCount)) {
   
    "development" !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }

  // 如果Observer不存在，则直接返回
  if (!ob) {
    target[key] = val;
    return val
  }

  // 如果Observer存在，则trigger change notification
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

Vue.prototype.$set = set;
```

* del()

```
function del (target, key) {
  if ("development" !== 'production' &&
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
    "development" !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }

  if (!hasOwn(target, key)) {
    return
  }

  delete target[key];

  if (!ob) {
    return
  }

  ob.dep.notify();
}

Vue.prototype.$delete = del;


```

* camelize()

```
var camelizeRE = /-(\w)/g;    // -后面紧跟着的字符，变成大写字母
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

例如: camelize('df-abcd-eee')  结果是："dfAbcdEee"
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

* sameVnode()

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

