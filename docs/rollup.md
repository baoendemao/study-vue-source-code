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

* 两种不同版本的vue
  * runtime only
  * runtime + compiler

* vue的rollup配置文件scripts/config.js
  * 由package.json中的scripts字段，可以看出rollup的配置文件是在scripts/config.js中
  * scripts/config.js文件：
  ```
    const aliases = require('./alias')
    const resolve = p => {
      const base = p.split('/')[0]
      if (aliases[base]) {
        return path.resolve(aliases[base], p.slice(base.length + 1))
      } else {
        return path.resolve(__dirname, '../', p)
      }
    }

    //  builds对象表示构建输出：
    //  entry表示打包入口
    //  dest表示打包出口
    //  format表示vue支持三种规范: commonjs, es module, umd
    //  env字段表示build了两种不同的环境：开发环境和生产环境
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
  
* build的js： scripts/build.js

```
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const rollup = require('rollup')
const uglify = require('uglify-js')

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

// 读取scripts/config.js
let builds = require('./config').getAllBuilds()

// filter builds via command line arg
// 根据命令行参数
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

build(builds)

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

function buildEntry (config) {
  const output = config.output
  const { file, banner } = output
  const isProd = /min\.js$/.test(file)
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ code }) => {
      if (isProd) {
        var minified = (banner ? banner + '\n' : '') + uglify.minify(code, {
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code
        return write(file, minified, true)
      } else {
        return write(file, code)
      }
    })
}

function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

```

* web的entry入口文件 web/entry-runtime-with-compiler.js

```
/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue

```