#### study-vue-source-code
本文主要整理一下自己学习vue源码的过程。如果有理解不对的地方，欢迎指出来，蟹蟹^_^。
#### 理解概念vdom, vnode
* html结构可以抽象成一棵dom树，vdom亦是如此，而vnode就是树上挂着的各个节点的抽象数据结构。

#### snabbdom
* [snabbdom的学习](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/snabbdom.md)

#### Vue
* [new Vue实例](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vue-instance.md)
* [vue的template更新](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vue-template-update.md)
* [vdom和真实的dom对比](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vr-dom-compare.md)
* [vue的生命周期](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vue-life-cycle.md)
* [vue的路由](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vue-router.md)
* [vue的指令](https://github.com/baoendemao/study-vue-source-code/tree/master/docs/vue-directive.md)

#### 源码学习推荐几个方便的操作
* 如何从git commit的记录来学习源码
    * git log命令可以查看push的commit编码（可以git log重定向到某个文件，以后每次方便查找）
    * git checkout commit编码的前六位
* 如何在一个文件夹中查找字符串

    ```
    // 例如： 查找生命周期钩子的定义LIFECYCLE_HOOKS， 可以找到在src/shared/constants.js
    wl@wangli: ~/front-end/study-code/vue/src $ find . -type file| xargs grep  LIFECYCLE_HOOKS
    ./core/config.js:import { LIFECYCLE_HOOKS } from 'shared/constants'
    ./core/config.js:  _lifecycleHooks: LIFECYCLE_HOOKS
    ./core/util/options.js:  LIFECYCLE_HOOKS
    ./core/util/options.js:LIFECYCLE_HOOKS.forEach(hook => {
    ./shared/constants.js:export const LIFECYCLE_HOOKS = [

    ```
* VsCode调试工具
    * ![avatar](https://github.com/baoendemao/study-vue-source-code/blob/master/images/vscode-debug-vue.jpeg)
* babel本地环境搭建
    * [见webpack-summary/babel部分](https://github.com/baoendemao/webpack-summary/tree/master/docs/babel.md)
    ```
    // 由于node对ES6的支持不好，可以使用babel-node命令执行
    study-vue-source-code/demos/use-vue $ babel-node --presets es2015   ./use-vue.js
    ```
