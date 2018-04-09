* Vue构造函数
    * MVVM ( Model View viewModel )
        * model： js抽象数据结构data
        * view：视图模板template
        * viewModel: 
        ```
        var viewModel = new Vue({
            data: { }   // mvvm中的第一个m, model
        });
        ```
    * data是怎么绑定到viewModel上的 ？
    	* 通过Object.defineProperty()[demo点这里](https://github.com/baoendemao/study-vue-source-code/tree/master/demos/use-vue/bind-data.js) 
    * 构造函数定义见vue源码src/core/instance/index.js[源码点这里](https://github.com/vuejs/vue/blob/dev/src/core/instance/index.js)
	    ```
	    // new Vue()只接收一个参数
	    function Vue (options) {
	        if (process.env.NODE_ENV !== 'production' &&
	            !(this instanceof Vue)
	        ) {
	            warn('Vue is a constructor and should be called with the `new` keyword')
	        }
	        // 参数初始化Vue属性
	        this._init(options)
	    }
    	```
* 
