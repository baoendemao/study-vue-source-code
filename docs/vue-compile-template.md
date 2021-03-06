#### 如何compile模板字符串
* 理解Javascript的编译和执行过程
  * 词法解析：经过分词和词法分析、语法解析转换成一个程序语法结构的树，即抽象语法树留（AST， abstract syntax tree）。在AST上的节点是JS的各个词法单元，如JS的关键字，变量等。
  * 代码生成：将AST转换成可执行代码。
  * 经过编译过程之后，最后执行JS代码。

* 模板字符串是如何转换成html结构的？
  * template模板通过render函数(h函数)，先生成抽象语法树(AST)，然后将AST转换成render函数, render函数返回vdom
  * 也可以直接跳过模板编译的过程，直接写render函数，这样性能会有所提升

* markOnce() => 标记v-once => Vue.prototype._o => vm._o

```
function markOnce (tree, index, key) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}
```

* markStatic() => 将vdom树上的所有节点标记static
```
// 对以tree为根的子树，标记静态子树， isOnce是指的是是否存在v-once
function markStatic (tree, key, isOnce) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}
```

* markStaticNode()

```

function markStaticNode (node, key, isOnce) {
  node.isStatic = true;    // 是否是静态节点
  node.key = key;
  node.isOnce = isOnce;    // 是否存在v-once
}

```

* genStatic()

```
function genStatic (el, state) {
  el.staticProcessed = true;
  state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
  return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
}
```

* genOnce()  =>  v-once

```
function genOnce (el, state) {

  el.onceProcessed = true;
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    var key = '';
    var parent = el.parent;
    while (parent) {
      if (parent.for) {
        key = parent.key;
        break
      }
      parent = parent.parent;
    }
    if (!key) {
      process.env.NODE_ENV !=='production' && state.warn(
        "v-once can only be used inside v-for that is keyed. "
      );
      return genElement(el, state)
    }
    return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
  } else {
    return genStatic(el, state)
  }
}
```

* genFor()  =>  v-for
```
function genFor (el, state, altGen, altHelper) {
  var exp = el.for;
  var alias = el.alias;
  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

  // 在开发环境中检测，如果不是slot标签或者template标签，v-for要加上key
  if (process.env.NODE_ENV !=='production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
      "v-for should have explicit keys. " +
      "See https://vuejs.org/guide/list.html#key for more info.",
      true /* tip */
    );
  }

  el.forProcessed = true; // avoid recursion
  return (altHelper || '_l') + "((" + exp + ")," +
    "function(" + alias + iterator1 + iterator2 + "){" +
      "return " + ((altGen || genElement)(el, state)) +
    '})'
}
```

* generate() => 模板编译的第三个步骤：根据AST生成render function

```


function generate(ast, options) {

  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  
  return {
    render: ("with(this){ return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

```

```
generate()函数中code形如：

_c('div',
  {attrs:{"id":"app"}},
  // 中括号里是子元素
  [
      _c('div',[
          _v(_s(name))
      ]),
      _v(" "),
      _c('div', [
          _v(_s(count))
      ]),
      _v(" "),
      _c('div',{
                  on:{"click":function($event){addCount()}}
                },
        [_v("click here")]
      )
  ]
)
```
