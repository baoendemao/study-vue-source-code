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

* hasOwn()

```
// 判断是对象自身属性，而不是来自于原型链
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}
```

* Object.freeze({})

```
// 不可以再添加新属性
var emptyObject = Object.freeze({});
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
```
* isBuiltInTag()

```
var isBuiltInTag = makeMap('slot,component', true);
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