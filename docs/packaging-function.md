文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

---

在Vue源码中，封装了很多优雅精辟的函数，本节主要介绍这些函数。


```

// 不可以再添加新属性
var emptyObject = Object.freeze({});

function isUndef (v) {
  return v === undefined || v === null
}

function isDef (v) {
  return v !== undefined && v !== null
}

// 判断真值，严格等于true
function isTrue (v) {
  return v === true
}

// 判断假值，严格等于false
function isFalse (v) {
  return v === false
}

// obj是纯对象的时候，返回true
var _toString = Object.prototype.toString;
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

// 利用纯函数fn来实现缓存
function cached (fn) {
  var cache = Object.create(null);  // 缓存初始化为空对象
  return (function cachedFn (str) {
    var hit = cache[str];      // 因为纯函数只依赖输入，所以这边可以使用输入当做Key
    return hit || (cache[str] = fn(str))  // 如果缓存中有，则取缓存中的，否则赋值给缓存相应的key，并返回。
  })
}

// 根据输入的字符串str建立一个map，其中str约定以逗号分隔， 返回一个根据入参来对map取值的函数
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