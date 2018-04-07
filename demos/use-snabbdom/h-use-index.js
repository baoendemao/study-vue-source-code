var snabbdom = require('./dist/snabbdom');
var h = require('./dist/h').default; // helper function for creating vnodes

var vnode = h('div#container.two.classes', 
	{on: {click: function(){}}}, 
	[
		h('span', {style: {fontWeight: 'bold'}}, 'This is bold'),
    	' and this is just normal text',
    	h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
  	]
);
console.log(vnode)

