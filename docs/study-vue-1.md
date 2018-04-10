* 文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ
---
* 第一步实例化Vue: new Vue({ })，首先会进入Vue的构造函数, 如下：
```
function Vue (options) {  
  if ("development" !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }

  this._init(options);
}
```
options参数对象变量来接收用户传入的实参， 实参对象里我们可以定义以下属性：el，data，computed，methods，watch，created， mounted，components等等。
从这个函数的开始大括号到结束大括号，该构造函数做了什么？ 
简单来说，就是分别处理我们传入的实参对象属性，在Vue.prototype上实现了很多方法，Vue和this上添加了很多属性。
入口就是this._init()，该方法也是在Vue.prototype原型上实现的。

* 从最熟悉的一个属性el挂载点开始说起 (比如el: #app)
从this._init(options)进入Vue.prototype._init()函数：
```
Vue.prototype._init = function (options) {

    /* 省略代码 */

    // vm就是this, this.$options.el = '#app'
    if (vm.$options.el) {    
        vm.$mount(vm.$options.el);   
    }
}
```
$mount函数也是在Vue.prototype原型上实现的, 这里通过Vue实例调用的原型链上的方法$mount
```
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && query(el);  // 返回dom节点。 id的值是app的dom节点，Vue是通过query('#app')函数，返回该dom节点
  
  /* 省略代码 */

}

function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);
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