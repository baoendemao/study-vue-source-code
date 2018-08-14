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
├── compiler  =>   模板template字符串的编译
├── core   => Vue的核心相关
├── platforms =>   平台相关的代码， vue现在支持web和weex
├── server   => 服务端渲染相关
├── sfc   =>  将vue文件编译成js。 如webpack不认识vue，打包的时候需要将vue编译成js
└── shared  => 被全局共享的辅助方法

6 directories, 0 files
```
* src/core目录 => vue的核心相关 

```
$ tree -L 1 src/core
src/core
├── components => 组件相关
├── config.js  
├── global-api  => 全局api封装
├── index.js
├── instance  => vue实例化
├── observer  => 响应式相关
├── util => 工具函数
└── vdom => 虚拟dom


```

#### package.json
* scripts字段

```
  "scripts": {
    "dev": "rollup -w -c scripts/config.js --environment TARGET:web-full-dev",
    "dev:cjs": "rollup -w -c scripts/config.js --environment TARGET:web-runtime-cjs",
    "dev:esm": "rollup -w -c scripts/config.js --environment TARGET:web-runtime-esm",
    "dev:test": "karma start test/unit/karma.dev.config.js",
    "dev:ssr": "rollup -w -c scripts/config.js --environment TARGET:web-server-renderer",
    "dev:compiler": "rollup -w -c scripts/config.js --environment TARGET:web-compiler ",
    "dev:weex": "rollup -w -c scripts/config.js --environment TARGET:weex-framework",
    "dev:weex:factory": "rollup -w -c scripts/config.js --environment TARGET:weex-factory",
    "dev:weex:compiler": "rollup -w -c scripts/config.js --environment TARGET:weex-compiler ",
    "build": "node scripts/build.js",
    "build:ssr": "npm run build -- web-runtime-cjs,web-server-renderer",
    "build:weex": "npm run build -- weex",
    "test": "npm run lint && flow check && npm run test:types && npm run test:cover && npm run test:e2e -- --env phantomjs && npm run test:ssr && npm run test:weex",
    "test:unit": "karma start test/unit/karma.unit.config.js",
    "test:cover": "karma start test/unit/karma.cover.config.js",
    "test:e2e": "npm run build -- web-full-prod,web-server-basic-renderer && node test/e2e/runner.js",
    "test:weex": "npm run build:weex && jasmine JASMINE_CONFIG_PATH=test/weex/jasmine.json",
    "test:ssr": "npm run build:ssr && jasmine JASMINE_CONFIG_PATH=test/ssr/jasmine.json",
    "test:sauce": "npm run sauce -- 0 && npm run sauce -- 1 && npm run sauce -- 2",
    "test:types": "tsc -p ./types/test/tsconfig.json",
    "lint": "eslint --fix src scripts test",
    "flow": "flow check",
    "sauce": "karma start test/unit/karma.sauce.config.js",
    "bench:ssr": "npm run build:ssr && node benchmarks/ssr/renderToString.js && node benchmarks/ssr/renderToStream.js",
    "release": "bash scripts/release.sh",
    "release:weex": "bash scripts/release-weex.sh",
    "release:note": "node scripts/gen-release-note.js",
    "commit": "git-cz"
  }
```

根据配置文件和命令行参数打出不同的包

#### runtime only版本和runtime + compiler版本
* runtime only版本
* runtime + compiler版本
    * 模板预编译成render函数，