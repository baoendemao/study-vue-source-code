文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

--

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

```