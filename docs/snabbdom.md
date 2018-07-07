* 为什么选择先学习snabbdom ？
    * 因为vue的vdom是在snabbdom的基础上改进的，而snabbdom比较小巧，可以帮助更好的理解vue。
* [snabbdom的官方github地址](https://github.com/snabbdom/snabbdom)
* 简单了解h()函数和patch()函数
    * 测试h()函数，生成vnode数据结构
    ```
    study-vue-source-code/demos/use-snabbdom $ cat h-use-index.js
    var snabbdom = require('./dist/snabbdom');
    var h = require('./dist/h').default; // helper function for creating vnodes

    var vnode = h('div#container.two.classes',
            {on: {click: function(){}}},
            [
                h('span', {style: {fontWeight: 'bold'}}, 'This is bold'),
                ' and this is just normal text',
                h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
            ]
    );
    console.log(vnode)

    study-vue-source-code/demos/use-snabbdom $ node h-use-index.js
    { sel: 'div#container.two.classes',                         
    data: { on: { click: [Function: click] } },
    children:
    [ { sel: 'span',
        data: [Object],
        children: undefined,
        text: 'This is bold',
        elm: undefined,
        key: undefined },
        { sel: undefined,
        data: undefined,
        children: undefined,
        text: ' and this is just normal text',
        elm: undefined,
        key: undefined },
        { sel: 'a',
        data: [Object],
        children: undefined,
        text: 'I\'ll take you places!',
        elm: undefined,
        key: undefined } ],
    text: undefined,
    elm: undefined,
    key: undefined }

    ```

    * 测试 patch()函数，渲染vnode到html
    ```
    study-vue-source-code/demos/use-snabbdom $ http-server
    
    然后浏览器访问http://localhost:8080/patch-use-index.html， 可以看到在div#container里渲染出new出来的vnode

    ```
* 理解h()函数
    * h()函数的传参
        * 第一个参数：html标签选择器
        * 第二个参数：{ prop1, prop2, ...}
        * 第三个参数: children数组
    * h()函数的输出 => vnode抽象数据结构
* 理解patch()函数
    * patch()函数两种传参方法：
        * patch(container, vnode)
            * 将vnode渲染到container dom容器中
        * patch(vnode, newVnode)
            * 比较vnode和newVnode, 将不同的部分渲染到container dom容器中，相同的部分不变
* 理解snabbdom vnode的抽象数据结构
    * 具体参见snabbdom的源码src/vnode.ts[源码点这里](https://github.com/snabbdom/snabbdom/blob/master/src/vnode.ts)

* 理解snabbdom dom树的相关操作
    * 源码具体参见src/snabbdom.ts[源码点这里](https://github.com/snabbdom/snabbdom/blob/master/src/snabbdom.ts)
