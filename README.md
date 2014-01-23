# MooMultiSelector is a mootools plugin for multi selecting

> suppot IE7+, other modern browsers

**Note**: please normalize css first, like use reset.css.

### OPTIONS:

**container**: 

id or an element

render MultiSelector html in it 

**prefix**: 

if more than one instances exist, each instance should be given an unique prefix to distinguish them, or probably will cause errors.
	  
**from**: 

data for selection can be initialized from a `<select multiple>`, id or element 

**data**: 

json array, if you wanna use local data and don't use a `<select multiple>` to init.
	  
```js
[
	{"label": "js", "value": "js", "selected": true},
	{"value": "nodejs"},
 	....
]
```

**size**: 

apply to the container which decides MultiSelector's size. 

```js 
{width: 300, height: 40}
```

**dropMaxHeight**: 

drop panel's max height, if content's height larger than this, scrollbar appears 

**local**: 

- *true*  : use local data to init MultiSelector.see `from` or `data`
- *false* : you should set `remote` option to load data from server, only support json format, as `data` option.

`remote` option is the same as options for mootools Request.JSON, so you can add some ajax callbacks as well. 

**remote**: 
you should set `local` as false first, then configure `remote` option, or ajax won't work
	 
**load**: 
	
- *now* : load data from server, when instance is initializing.
- *after* : use `instance.load()` method to trigger load event whenever you like
	
**name**: 

if you invoke `trans2Select()`, it will create an `<select multiple>` in container, the name is for it.maybe you want to submit a from, I guess. so you can get selected values in back end by its name

### CALLBACKS:

**select**: 

```js
function(item, instance) { //... } 
```

**unselect**: 

```js
function(item, instance) { //... } 
```

*note: item is an object as below* 

```js
{label: 'javascript', value: 'javascript'}
```

### METHODS:

**load()**: 

it's useful, when you use ajax and set `load: "after"`, you can load data whenever you like

**getSelected()**: 

return selected items, like 

```js
[{value: 'nodejs', label: 'nodejs'}, ....]
```

**trans2Select()** : 

create a `<select multiple>` in container, invoke it before you submit your form,if you use `from` option, it will refresh selected options in the specified `<select multiple>`. and invoke it more than one time, it just does refresh.

*you can scroll forth and back when your mouse is in container to see all items you selected.* 

you can run **demo.html** to see more details.     
