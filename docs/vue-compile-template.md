#### 如何compile模板字符串
* 理解Javascript的编译和执行过程
  * 词法解析：经过分词和词法分析、语法解析转换成一个程序语法结构的树，即抽象语法树留（AST， abstract syntax tree）。在AST上的节点是JS的各个词法单元，如JS的关键字，变量等。
  * 代码生成：将AST转换成可执行代码。
  * 经过编译过程之后，最后执行JS代码。

* 模板字符串是如何转换成html结构的？
  * 通过render函数，先生成抽象语法树(AST)，然后将AST转换成render函数, render函数返回vdom




* markOnce() => 标记v-once

```
function markOnce (tree, index, key) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}
```

* markStatic()
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
      "development" !== 'production' && state.warn(
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

  if ("development" !== 'production' &&
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


function generate(ast, options) {

  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  
  return {
    render: ("with(this){ return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

