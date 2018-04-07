#### vue模板字符串解析
* 首先理解ES6模板字符串, 参见[javascript总结/string部分](https://github.com/baoendemao/javascript-summary/tree/master/docs/string.md)
* 如何使用vue模板
通过Vue.component注册组件的时候，初始化组件的模板。
```
<div id="example">
  <my-component></my-component>
</div>

// 注册组件
Vue.component('my-component', {
  template: '<div>A custom component!</div>'
})

// 创建根实例
new Vue({
  el: '#example'
})

```
* 模板字符串是如何转换成html结构

* 在模板中绑定数据 => 数据和视图分离
  * 现象
    * 数据更新的时候，视图也对应的更新