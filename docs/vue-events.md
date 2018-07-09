#### 创建过程
* initEvents() => 在vm._events上初始化事件
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
```
var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});
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

* checkKeyCodes() => Vue.prototype._k => vm._k
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
* isKeyNotMatch()
```
function isKeyNotMatch (expect, actual) {

  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

```
* add() => 添加事件

```
var target;

function add (event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}
```

* remove$1() => 销毁事件
```
function remove$1 (event, fn) {
  target.$off(event, fn);
}
```

* normalizeEvents()
```
function normalizeEvents (on) {

  /* istanbul ignore if */
  if (isDef(on[RANGE_TOKEN])) {
    // IE input[type=range] only supports `change` event
    var event = isIE ? 'change' : 'input';
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
    delete on[RANGE_TOKEN];
  }
  // This was originally intended to fix #4521 but no longer necessary
  // after 2.5. Keeping it for backwards compat with generated code from < 2.4
  /* istanbul ignore if */
  if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
    on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
    delete on[CHECKBOX_RADIO_TOKEN];
  }
}
```

* createOnceHandler()
```

var target$1;

function createOnceHandler (handler, event, capture) {

  var _target = target$1; // save current target element in closure
  return function onceHandler () {
    var res = handler.apply(null, arguments);
    if (res !== null) {
      remove$2(event, onceHandler, capture, _target);
    }
  }
}

```
* add$1()

```
function add$1 (
  event,
  handler,
  once$$1,
  capture,
  passive
) {

  handler = withMacroTask(handler);
  
  if (once$$1) { handler = createOnceHandler(handler, event, capture); }
  
  target$1.addEventListener(event, handler,
    supportsPassive? { capture: capture, passive: passive }: capture
  );
}

```
* remove$2()
```

function remove$2 (
  event,
  handler,
  capture,
  _target
) {

  // 移除由 document.addEventListener() 方法添加的事件句柄。
  (_target || target$1).removeEventListener(
    event,
    handler._withTask || handler,
    capture
  );
}
```
* updateDOMListeners()
```

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


var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
}

```