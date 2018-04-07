var data = {
    propA: 'hello'
};

var myVue = {};
Object.defineProperty(
    myVue,
    'propA',
    {
        get() {
            console.log('get function');
            return data['propA'];
        },
        set(value) {
            data['propA'] = value;
            console.log('set function');
        }
    }
);

console.log(myVue['propA']);   // get()函数被调用, 打印'get function' hello
myVue['propA'] = 'world';      // set()函数被调用, 打印'set function' 
console.log(data['propA']);    // 打印world
