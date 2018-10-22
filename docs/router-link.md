#### vue-router
* vue-router可以看做是vue的一个插件，也是通过Vue.use()注册到全局的
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
