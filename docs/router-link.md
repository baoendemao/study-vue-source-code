#### vue-router
* vue-router可以看做是vue的一个插件，也是通过Vue.use()注册到全局的, 之后可以通过this.$route来访问路由。
* vue-router的功能
    * 嵌套的路由/视图表
    * 模块化的、基于组件的路由配置
    * 路由参数、查询、通配符
    * 基于 Vue.js 过渡系统的视图过渡效果
    * 细粒度的导航控制
    * 带有自动激活的 CSS class 的链接
    * HTML5 历史模式或 hash 模式，在 IE9 中自动降级
    * 自定义的滚动条行为
* 三种路由方式
    * hash
    * history
    * abstract
* 两种组件
    * router-view
    ```
        <!-- component matched by the route will render here -->
        <router-view></router-view>
    ```
    * router-link
    ```
        <!-- `<router-link>` will be rendered as an `<a>` tag by default -->
        <router-link to="/bar">Go to Bar</router-link>
    ```
* SPA(single page application)
    * vue + vue-router
    * 对于一棵组件树，vue-router所做的就是：将路由映射到组件。
* 