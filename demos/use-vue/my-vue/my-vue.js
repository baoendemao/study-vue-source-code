function MyVue(options) {
    this._init(options);
}

initMixin(MyVue);


// 在MyVue原型上定义_init函数
function initMixin (MyVue) {

  MyVue.prototype._init = function (options) {

    var vm = this;
    console.log(vm instanceof MyVue)

    vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
    );
  }
}

// 此函数的入参是MyVue的constructor, 即MyVue构造函数本身
function resolveConstructorOptions (Ctor) {

  console.log(Ctor === Vue);  // true
  var options = Ctor.options;   // 区分Vue.options和vm.$options
  console.log(Ctor.options);    // 什么时候Vue.options添加成这样了： {components: {…}, directives: {…}, filters: {…}, _base: ƒ}

  if (Ctor.super) {    
    // 先不考虑有父类的情况
    
  }
  return options;
}

var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

function mergeOptions (
  parent,
  child,
  vm
) {
 
  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
    /*合并parent与child*/
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

