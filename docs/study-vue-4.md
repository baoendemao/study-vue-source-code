文章主要记录学习Vue的过程，由于水平有限，有理解不对的地方，欢迎指出来，Thanks♪(･ω･)ﾉ

--

#### Vue是怎么实现的响应式 ？

想一下，每次我们改变data对象里的变量的值，视图template会立刻给我们反馈其变化，反之亦然，这就是最简单的MVVM的解释。看例子：

```

var data = { a: 1 }
var vm = new Vue({
  el: '#example',
  data: data
})

vm.$data === data // true
vm.$el === document.getElementById('app')

vm.$watch('a', function (newValue, oldValue) {
    console.log('a has been changed: ' + vm.a);
})

// 改变vm.a和data.a都会出发watch的回调
vm.a = 2;    // a has been changed: 2
data.a = 3;  // a has been changed: 3

// 如果之后再在data和vm添加属性，将不会被watch
vm.b = 1;
console.log(data.b);   // undefined
data.c = 1;
console.log(vm.c);     // undefined

```


首先了解几个概念：
（1）Object.defineProperty()  [demo点这里](https://github.com/baoendemao/javascript-summary/tree/master/demos/demo-object/object-1.js)，
Vue实现MVVM也是基于Object.defineProperty()在赋值和取值的时候进行拦截的。
（2）Object.freeze()  [demo点这里](https://github.com/baoendemao/javascript-summary/tree/master/demos/demo-object/object-3.js)。

在MVVM(Model View ViewModel), 其中model指的是js抽象数据结构data，view指的是视图模板template，viewModel指的是我们new出来的Vue实例：

```

```

在Vue源码中，经常会使用变量vm来指代我们new出来的this，Vue在vm上定义了许多以$开头的属性和方法。

```
```

  

