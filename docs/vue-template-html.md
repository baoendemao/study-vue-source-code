#### vue模板字符串解析
* 理解Javascript的编译和执行过程
  * 词法解析：经过分词和词法分析、语法解析转换成一个程序语法结构的树，即抽象语法树留（AST， abstract syntax tree）。在AST上的节点是JS的各个词法单元，如JS的关键字，变量等。
  * 代码生成：将AST转换成可执行代码。
  * 经过编译过程之后，最后执行JS代码。
* 理解ES6模板字符串, 参见[javascript总结/string部分](https://github.com/baoendemao/javascript-summary/tree/master/docs/string.md)
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
* 模板字符串是如何转换成html结构的？
  * 通过render()函数，将模板template看作字符串
  * 通过render函数，先生成抽象语法树(AST)，然后将AST转换成render函数, render函数返回vdom

* 在模板中绑定数据 => 数据和视图分离
  * 现象
    * 数据更新的时候，视图也对应的更新
