#### Vue实例的生命周期
* LIFECYCLE_HOOKS定义([源码点这里](https://github.com/vuejs/vue/blob/dev/src/shared/constants.js))
    ```
    export const LIFECYCLE_HOOKS = [
        'beforeCreate',
        'created',
        'beforeMount',
        'mounted',
        'beforeUpdate',
        'updated',
        'beforeDestroy',
        'destroyed',
        'activated',
        'deactivated',
        'errorCaptured'
    ]
    ```