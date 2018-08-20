#### rollup打包
* vue通过rollup打包成单独的一个文件
```
// package.json的scripts字段

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
  },
```

* rollup中文官方文档： https://rollupjs.org/guide/zh

* vue的rollup配置文件scripts/config.js
  * 由package.json中的scripts字段，可以看出rollup的配置文件是在scripts/config.js中
  * scripts/config.js文件的builds对象表示构建输出：
  ```

    const builds = {
      // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
      'web-runtime-cjs': {
        entry: resolve('web/entry-runtime.js'),
        dest: resolve('dist/vue.runtime.common.js'),
        format: 'cjs',
        banner
      },
      // Runtime+compiler CommonJS build (CommonJS)
      'web-full-cjs': {
        entry: resolve('web/entry-runtime-with-compiler.js'),
        dest: resolve('dist/vue.common.js'),
        format: 'cjs',
        alias: { he: './entity-decoder' },
        banner
      },
      // Runtime only (ES Modules). Used by bundlers that support ES Modules,
      // e.g. Rollup & Webpack 2
      'web-runtime-esm': {
        entry: resolve('web/entry-runtime.js'),
        dest: resolve('dist/vue.runtime.esm.js'),
        format: 'es',
        banner
      },
      // Runtime+compiler CommonJS build (ES Modules)
      'web-full-esm': {
        entry: resolve('web/entry-runtime-with-compiler.js'),
        dest: resolve('dist/vue.esm.js'),
        format: 'es',
        alias: { he: './entity-decoder' },
        banner
      },
      // runtime-only build (Browser)
      'web-runtime-dev': {
        entry: resolve('web/entry-runtime.js'),
        dest: resolve('dist/vue.runtime.js'),
        format: 'umd',
        env: 'development',
        banner
      },
      // runtime-only production build (Browser)
      'web-runtime-prod': {
        entry: resolve('web/entry-runtime.js'),
        dest: resolve('dist/vue.runtime.min.js'),
        format: 'umd',
        env: 'production',
        banner
      },
      // Runtime+compiler development build (Browser)
      'web-full-dev': {
        entry: resolve('web/entry-runtime-with-compiler.js'),
        dest: resolve('dist/vue.js'),
        format: 'umd',
        env: 'development',
        alias: { he: './entity-decoder' },
        banner
      },
      // Runtime+compiler production build  (Browser)
      'web-full-prod': {
        entry: resolve('web/entry-runtime-with-compiler.js'),
        dest: resolve('dist/vue.min.js'),
        format: 'umd',
        env: 'production',
        alias: { he: './entity-decoder' },
        banner
      },
      // Web compiler (CommonJS).
      'web-compiler': {
        entry: resolve('web/entry-compiler.js'),
        dest: resolve('packages/vue-template-compiler/build.js'),
        format: 'cjs',
        external: Object.keys(require('../packages/vue-template-compiler/package.json').dependencies)
      },
      // Web compiler (UMD for in-browser use).
      'web-compiler-browser': {
        entry: resolve('web/entry-compiler.js'),
        dest: resolve('packages/vue-template-compiler/browser.js'),
        format: 'umd',
        env: 'development',
        moduleName: 'VueTemplateCompiler',
        plugins: [node(), cjs()]
      },
      // Web server renderer (CommonJS).
      'web-server-renderer': {
        entry: resolve('web/entry-server-renderer.js'),
        dest: resolve('packages/vue-server-renderer/build.js'),
        format: 'cjs',
        external: Object.keys(require('../packages/vue-server-renderer/package.json').dependencies)
      },
      'web-server-renderer-basic': {
        entry: resolve('web/entry-server-basic-renderer.js'),
        dest: resolve('packages/vue-server-renderer/basic.js'),
        format: 'umd',
        env: 'development',
        moduleName: 'renderVueComponentToString',
        plugins: [node(), cjs()]
      },
      'web-server-renderer-webpack-server-plugin': {
        entry: resolve('server/webpack-plugin/server.js'),
        dest: resolve('packages/vue-server-renderer/server-plugin.js'),
        format: 'cjs',
        external: Object.keys(require('../packages/vue-server-renderer/package.json').dependencies)
      },
      'web-server-renderer-webpack-client-plugin': {
        entry: resolve('server/webpack-plugin/client.js'),
        dest: resolve('packages/vue-server-renderer/client-plugin.js'),
        format: 'cjs',
        external: Object.keys(require('../packages/vue-server-renderer/package.json').dependencies)
      },
      // Weex runtime factory
      'weex-factory': {
        weex: true,
        entry: resolve('weex/entry-runtime-factory.js'),
        dest: resolve('packages/weex-vue-framework/factory.js'),
        format: 'cjs',
        plugins: [weexFactoryPlugin]
      },
      // Weex runtime framework (CommonJS).
      'weex-framework': {
        weex: true,
        entry: resolve('weex/entry-framework.js'),
        dest: resolve('packages/weex-vue-framework/index.js'),
        format: 'cjs'
      },
      // Weex compiler (CommonJS). Used by Weex's Webpack loader.
      'weex-compiler': {
        weex: true,
        entry: resolve('weex/entry-compiler.js'),
        dest: resolve('packages/weex-template-compiler/build.js'),
        format: 'cjs',
        external: Object.keys(require('../packages/weex-template-compiler/package.json').dependencies)
      }
    }
  ```

  entry表示打包入口<br/>
  dest表示打包出口<br/>
  format表示vue支持三种规范: commonjs, es module, umd。<br/>
  env字段表示build了两种不同的环境：开发环境和生产环境。<br/>
  * build除了模块规范不同以外，还分为了:
    * runtime only
    * runtime + compiler