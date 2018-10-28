#### 浏览器的history
* history.pushState()
* history.replaceState()
* window.onpopstate
* history.forward
* history.back
* history.go

#### vue-router中判断是否支持history
```

// 当supportsPushState为true的时候，才可以使用history mode
var supportsPushState = inBrowser && (function () {
  var ua = window.navigator.userAgent;

  if (
    (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
    ua.indexOf('Mobile Safari') !== -1 &&
    ua.indexOf('Chrome') === -1 &&
    ua.indexOf('Windows Phone') === -1
  ) {
    return false
  }

  return window.history && 'pushState' in window.history
  
})();

```