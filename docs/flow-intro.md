#### flow
* 安装flow
```
$ npm install flow-bin

$ flow
Could not find a .flowconfig in . or any of its parent directories.
See "flow init --help" for more info

// 初始化
$ flow init
$ ls -la
total 8
drwxr-xr-x  3 wl  staff  102 Aug 11 12:25 .
drwxr-xr-x  9 wl  staff  306 Aug 11 11:58 ..
-rw-r--r--  1 wl  staff   58 Aug 11 12:25 .flowconfig

// flow的配置文件
$ cat .flowconfig  
[ignore]

[include]

[libs]

[lints]

[options]

[strict]

```

* 使用flow静态类型检查
```
$ cat index.js
/*@flow*/

function func(x:number, y:number) : number {
    return x + y;
}

func(1, 'vue');


// 静态类型检查，报错：y必须是number类型
$ flow
Error ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ index.js:7:9

Cannot call func with 'vue' bound to y because string [1] is incompatible with number [2].

 [2]  3│ function func(x:number, y:number) : number {
      4│     return x + y;
      5│ }
      6│
 [1]  7│ func(1, 'vue');



Found 1 error
```

* flow的github地址： https://github.com/facebook/flow

学习flow，更有助于学习vue的源码。