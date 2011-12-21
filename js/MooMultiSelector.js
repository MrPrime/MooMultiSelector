var MooMultiSelector = new Class({

	Implements: [Options, Events],

	options: {
		container: '',
		name: '', 
		from: '',
		data: [],  
		prefix: '',
		local: true,
		remote: {}, 
		load: 'now', 
		size: {   
			width: 302,
			height: 32
		},
		dropMaxHeight: 250,
		msg: {
			empty: 'data is not ready yet...',
			error: 'oops, data load error...',
			loading: 'data is loading,wait...'
		}
	},

	initialize: function(options) {
		this.setOptions(options);
		
		this.$initBaseHtml();
		this.$initVariable();
		
		var from = this.options.from,
			isLocal = this.options.local,
			now = this.options.load;
		
		if(isLocal)	{
			if(from) this.$initFromSelect(from);
			else this.$initFromJson();
			// after init data ,calculate height of drop panel immediately
			this.$initDropHeight();
		} else {
			this.$initRequest();
			
			if(now === 'now') this.load();
		}
		
		this.$initEvents();
	},

	// load data by ajax
	load: function() {		
		// load only once ?
		if(!this.loaded)
			this.$request.send(arguments[0]);
	},

	// get selected items 
	getSelected: function() {
		var items = this.dropPanel.getElements('li.multi-drop-option'),
			rt = [];
		items.each(function(item, index) {
			if(item.retrieve('selected')) {
				var obj = {
					label: item.get('text'),
					value: item.get('data-value')
				};
				rt.push(obj);
			}
		});
		
		return rt;
	},

	// transform to corresponding select for form submit
	trans2Select:function() {
		var items = this.getSelected(), 
			select = null, options = []; // store select <option> 
		if(this.$select) {
			select = this.$select;
		} else {
			select = this.$select = new Element('select', {
				name: this.options.name
			}).setProperty('multiple', true).setStyle('display','none').inject(this.container);
		}
		select.empty();
		items.each(function(obj) {
			options.push(new Option(obj.label, obj.value, true, true)); 
		});
		select.adopt(options);
	},

	// init requset instance for ajax
	$initRequest: function() {
		var self = this,
			cfg = self.options.remote;
		
		this.$request = new Request.JSON(cfg).addEvent('request', function() {
			// show loading...
			self.seledCon.addClass('multi-data-loading');
			self.$showMsg('loading');
		}).addEvent('success', function(data) {
			self.seledCon.empty();
			
			// parse json data
			self.$parseSource(data);
			
			self.$initDropHeight();
		}).addEvent('failure', function() {
			// show err message
			self.$showMsg('error');
		}).addEvent('timeout', function() {
		
			self.$showMsg('error');
		}).addEvent('complete', function(data) {
			// remove loading style
			self.seledCon.removeClass('multi-data-loading');
		});
	},

	// calculate dropPanel's height
	$initDropHeight: function() {
		var dropPanel = this.dropPanel,
			oldStyles = dropPanel.style.cssText;
		
		// make it block but invisible
		dropPanel.h = dropPanel.setStyles({
			visibility: 'hidden',
			display: 'block'
		}).getStyle('height').toInt();
		
		// restore old styles
		dropPanel.style.cssText = oldStyles;
	},
		
	$initVariable: function() {
		this.seledCon.totalWidth = 0;
		this.seledWrapper.w = this.seledWrapper.getStyle('width').toInt();
		this.loaded = false; // for checking whether data is ready
		this.$select = null; // <select> for form submit 
	},

	// create basic html structure 
	$initBaseHtml: function() {
		var prefix = this.options.prefix.trim(),
			con = this.options.container,
			size = this.options.size;
			
		var getId = this.$getId;
		
		this.container = document.id(con).setStyles({
			position: 'relative',
			width: size.width,
			height: size.height
		});
		
		this.inputPanel = new Element('div', {
			styles: {
				overflow: 'hidden',
				border: '1px solid #acacac',
				width: size.width - 2,
				height: size.height - 2
			},
			
			'class': 'multi-input-panel-cls',
			
			id: getId(prefix, 'multi-input-panel')
		});
		
		this.dropTrig = new Element('a', {
			styles: {
				height: size.height - 2,
				width: 29,
				'border-left': '1px solid #acacac',
				'line-height': size.height - 2,
				'text-align': 'center',
				'float': 'right'
			},
			href: '#',
			text: '▼',
			
			'class': 'multi-drop-trigger-cls',
			
			id: getId(prefix, 'multi-drop-trigger')
		});
		
		this.seledWrapper = new Element('div', {
			styles: {
				overflow: 'hidden',
				padding: '4px 0 4px 4px',
				width: size.width - 36,
				height: size.height - 10,
				position: 'relative',
				'float': 'left'
			},
			
			'class': 'multi-seled-wrapper-cls',
			
			id: getId(prefix, 'multi-seled-wrapper')
		});
		
		this.seledCon = new Element('div', {
			styles: {
				overflow: 'hidden',
				height: size.height - 10,
				width: 1500,
				position: 'absolute'
			},
			
			'class': 'multi-seled-con-cls',
			
			id: getId(prefix, 'multi-seled-con')
		});
		
		this.seledWrapper.grab(this.seledCon);
		this.inputPanel.adopt([this.seledWrapper, this.dropTrig]);
		
		this.dropPanel = new Element('div', {
			styles: {
				'margin-top': 1,
				'max-height': this.options.dropMaxHeight,
				'z-index': 999,
				width: size.width - 2,
				position: 'absolute',
				border: '1px solid #acacac',
				display: 'none'
			},
			
			'class': 'multi-drop-panel-cls',
			
			id: getId(prefix, 'multi-drop-panel')
		});
		
		this.container.adopt([this.inputPanel, this.dropPanel]);
	},

	// init items from options of specified multi selector
	$initFromSelect: function(from) {
		var fromEl = document.id(from).setStyle('display', 'none');

		this.$select = fromEl;
		this.$parseSource(fromEl);			
	},

	// init items from json array if data is specified
	$initFromJson: function() {
		var data = this.options.data;
		this.$parseSource(data);
	},

	// parse data: json array format or from a multi select
	$parseSource: function(source) {
		var self = this,
			srcItems = [],
			$seledEls = [], // store selected items and then add them to seledCon
			$ul = new Element('ul'),
			size = this.options.size;
		
		// multi select
		if(source.nodeName == 'SELECT') {
			srcItems = source.getChildren(); // options of select
		// json array
		} else srcItems = source 

		srcItems.each(function(el, index) {
			var dataIndex = index + 1,
				value = el.value,
				label = undefined,
				selected = el.selected ? true : false;
			
			if(el.nodeName == 'OPTION') label = el.get('text');
			var label = label ? label : value;
			
			// li in dropPanel
			var $li = new Element('li', {
				'data-value': value,
				'data-index': dataIndex,
				
				'class': 'multi-drop-option',
			
				text: label
			}).inject($ul).store('selected', false);
			
			if(srcItems.length == index + 1) $li.addClass('last-multi-drop-option');
			
			if(selected) {
				$li.store('selected', true).addClass('multi-drop-option-selected');
				
				var seledEl = self.$addSeledAnchor(dataIndex, label, value);
				$seledEls.push(seledEl);
			}
		});
		
		this.seledCon.adopt($seledEls);
		this.dropPanel.grab($ul);
		
		// calculate total width of all selected items, including margin-right
		var self = this;
		$seledEls.each(function(el, index) {
			self.seledCon.totalWidth += el.getSize().x + el.getStyle('margin-right').toInt();	
		});
		
		this.$calcuScroll(false);
		
		this.loaded = true; // data is ready, dropPanel enabled
	},

	$initEvents: function() {
		var self = this,
			// key elements
			seledCon = self.seledCon,
			seledWrapper = self.seledWrapper,
			dropPanel = self.dropPanel,
			dropTrig = self.dropTrig,
			container = self.container;
		
		// scroll seledCon when scroll mousewheel
		seledCon.addEvent('mousewheel', function(event) {
			if(seledCon.retrieve('scrollable', false)) {
				var mousePos = {
					x: event.page.x,
					y: event.page.y
				};
				
				// mouse position is in seledWrapper
				if(self.$isInEl(mousePos, seledWrapper)) {
					event.stop();
					
					var oldMLeft = seledCon.getStyle('margin-left').toInt(),
						newMLeft = 0, 
						scrollRange = seledCon.scrollRange; 
						
					newMLeft = oldMLeft + event.wheel * 15;
					
					// margin-left should be in [0, -scrollRange]
					if(newMLeft > 0) newMLeft = 0;
					if(newMLeft < -scrollRange) newMLeft = -scrollRange;
					
					// scroll seledCon to show more selected items
					seledCon.setStyle('margin-left', newMLeft);
				}
			}
		});
		
		// dropPanel animation instance
		this.dropTween = new Fx.Tween(dropPanel, {
			duration: 'short',
			onStart: function(el) {
				var toggle = dropTrig.retrieve('open');
				if(!toggle) {
					el.setStyles({
						'height': 0,
						'display': 'block'
					});
				}
				// no matter slide up or slide down, hide scrollbar
				el.setStyle('overflow', 'hidden');
			},
			onComplete: function(el) {
				var toggle = dropTrig.retrieve('open');
				if(toggle) {
					dropTrig.set('text', '▼');
					el.setStyle('display', 'none');
				} else {
					dropTrig.set('text', '▲');
					el.setStyle('overflow', 'auto');
				}
				dropTrig.store('open', !toggle);
			}
		});

		// select or unselect li in dropPanel
		dropPanel.addEvent('click:relay(li)', function(event, target) {
			var index = target.get('data-index'),
				lbl = target.get('text'), 
				val = target.get('data-value'),
				obj = {label: lbl, value: val};
			// if it has been selected, then unselect it
			if(target.retrieve('selected')) {
				// get corresponding anchor from seledCon by data-index
				var	aEl = seledCon.getElement('a.multi-seled-item[data-index=' + index + ']');
				
				seledCon.totalWidth -= (aEl.getSize().x + aEl.getStyle('margin-right').toInt());
			
				target.store('selected', false).removeClass('multi-drop-option-selected');
				
				// fade out the anchor
				self.$fadeOutAndAdjust(aEl);
				
				// fire unselect event
				self.fireEvent('unselect',[obj, self]);
				
			} else {
				// set li selected tag and selected style
				target.store('selected', true).addClass('multi-drop-option-selected');
				
				// get value and label from selected li
				// append an anchor to seledCon
				var newaEl = self.$addSeledAnchor(index, lbl, val).inject(seledCon).highlight('#dcdcdc');
				
				seledCon.totalWidth += newaEl.getSize().x + newaEl.getStyle('margin-right').toInt();
				self.$calcuScroll(true);
				
				// fire select event
				self.fireEvent('select', [obj, self]);
			}
		}).addEvent('mouseover:relay(li)', function(event, target) {
			
			target.addClass('multi-drop-option-hover')
				.getSiblings('li.multi-drop-option-hover')
				.removeClass('multi-drop-option-hover');
		}).addEvent('mouseleave', function() {
			
			var hoveredEl = this.getElement('li.multi-drop-option-hover');
			if(hoveredEl != null) 
				hoveredEl.removeClass('multi-drop-option-hover');
		});
		
		// if mouse leave container, drop panel will auto slide up in 1s
		container.addEvent('mouseleave', function() {
			if(dropTrig.retrieve('open')) {
				
				dropPanel.timeoutId = (function() {
					dropTrig.fireEvent('click');
				}).delay(1000);
			}
		}).addEvent('mouseenter', function() {
			if(dropPanel.timeoutId) 
				clearTimeout(dropPanel.timeoutId);
		});
		
		// toggle drop panel by clicking dropTrig
		dropTrig.store('open', false).addEvent('click', function(event) {
			// if data not ready, show tip
			if(!self.loaded) {
				self.$showMsg('empty');
				return false;
			}
			if(event) event.stop();
			
			var toggle = dropTrig.retrieve('open');
			
			if(toggle) self.dropTween.start('height', dropPanel.h, 0);
			else self.dropTween.start('height', 0, dropPanel.h);
		});
	},

	// show message
	$showMsg: function(type) {
		var seledCon = this.seledCon;
		
		var msg = seledCon.getElement('p.msg');
		if(msg) {
			msg.className = 'msg ' + type;
			msg.set('html', this.options.msg[type]);
			return;
		}
		
		new Element('p.msg.' + type, {
			text: this.options.msg[type]
		}).inject(seledCon);
	},

	// return an Anchor represent selected li
	$addSeledAnchor: function(index, lbl, val) {
		var self = this,
			size = self.options.size;
		
		var newaEl = new Element('a', {
			styles: {
				display: 'inline-block',
				height: size.height - 10,
				'line-height': size.height - 10,
				'margin-right': 5,
				'text-align': 'center',
				position: 'relative',
				padding: '0 15px 0 4px',
				overflow: 'hidden',
				'float': 'left'
			},
			
			href: '#',
			'class': 'multi-seled-item',
			'data-index': index,
			'data-value': val,
			title: lbl,
			
			html: lbl
		}).grab(new Element('span', {
			styles: {
				position: 'absolute',
				height: size.height - 10,
				right: 0,
				top: 0,
				width: 13
			},
			'class': 'close',
			html: 'x'
		})).addEvent('click', function(event) {
			event.stop();
			
			var target = event.target, aEl = this,
				index = aEl.get('data-index');
				
			if(target.tagName == 'SPAN' && target.className == 'close') {
				// anchor deleted and restore corsponding item's state
				self.dropPanel.getElement(' > ul li:nth-child(' + index + ')')
					.removeClass('multi-drop-option-selected').store('selected', false);
			
				// compute selected items total length
				self.seledCon.totalWidth -= (aEl.getSize().x + aEl.getStyle('margin-right').toInt());
				
				self.$fadeOutAndAdjust(aEl);
				
				// fire unselect event
				var obj = {lable: aEl.get('title'), value: aEl.get('data-value')};
				self.fireEvent('unselect',[obj, self]);
			}
		});
		return newaEl;
	},

	// fade out and destroy anchor, adjust seledCon's margin-left 
	$fadeOutAndAdjust: function(aEl) {
		var self = this;
		
		new Fx.Tween(aEl, {
			duration: 200,
			onComplete: function(el) {
				el.destroy();
				// adjust margin-left of seledCon
				self.$calcuScroll(true);
			}
		}).start('opacity', 1, 0);
	},

	// calculate scroll range 
	$calcuScroll: function(adjust) {
		var wrap_w = this.seledWrapper.w,
			con_tw = this.seledCon.totalWidth;
			
		if(wrap_w < con_tw) {
			this.seledCon.store('scrollable', true);
			
			this.seledCon.scrollRange = con_tw - wrap_w;
			
			// if adjust is true, adjust margin-left
			if(adjust) 
				this.seledCon.setStyle('margin-left', -this.seledCon.scrollRange);
		} else {
			this.seledCon.store('scrollable', false);
			this.seledCon.setStyle('margin-left', 0);
		}
	},

	// check if mouse position is in an specified element
	$isInEl: function(pos, el) {
		var elDim = el.getCoordinates(),
			inX = elDim.left < pos.x && elDim.right > pos.x,
			inY = elDim.top < pos.y && elDim.bottom > pos.y;

		if(inX && inY) return true;
		return false;
	},

	// get proper id 
	$getId: function(prefix, value) {
		return prefix ? (prefix + '-' + value) : value;
	}
});