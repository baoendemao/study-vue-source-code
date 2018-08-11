#### Vue源码的目录结构
* vue的根目录
```
$ tree -L 1
.
├── BACKERS.md
├── LICENSE
├── README.md
├── benchmarks
├── dist
├── examples
├── flow  =>  flow类型检查相关的类型定义
├── package.json
├── packages
├── scripts
├── src
├── test
├── types
└── yarn.lock

9 directories, 5 files
```

* src目录
```
$ tree -L 1 src
src
├── compiler  =>   模板字符串的编译
├── core   => Vue的核心相关
├── platforms =>   平台相关的代码
├── server   => 服务端渲染相关
├── sfc   =>  将vue文件编译成js对象
└── shared  => 被全局共享的辅助方法

6 directories, 0 files
```
* src/core目录 => vue的核心相关 

```
$ tree -L 1 src/core
src/core
├── components
├── config.js
├── global-api
├── index.js
├── instance
├── observer  => 响应式相关
├── util => 工具方法
└── vdom => 虚拟dom


```