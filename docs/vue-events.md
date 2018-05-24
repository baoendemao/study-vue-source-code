文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

--

#### 创建过程
* initEvents()
```
// 初始化事件
function initEvents (vm) {

  vm._events = Object.create(null);
  vm._hasHookEvent = false;

  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
```

* updateDOMListeners()

```
var target$1;   // 全局的, 要执行事件的目标dom对象


function updateDOMListeners (oldVnode, vnode) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  normalizeEvents(on);
  updateListeners(on, oldOn, add$1, remove$2, vnode.context);
  target$1 = undefined;
}

```

* keyCodes => v-on事件修饰符的keyCode的别名
```
var keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
};
```

* checkKeyCodes()
```
function checkKeyCodes (eventKeyCode, key, builtInKeyCode, eventKeyName, builtInKeyName) {

  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

```