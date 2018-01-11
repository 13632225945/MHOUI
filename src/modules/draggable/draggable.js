/*
new draggable({
	$el: $('<div></div>'),								//[$]
	$proxy: null,													//[String|$|Function]
	revert: false,												//[Boolean]
	onBeforeDrag: function(e){},					//[Function]
	onStartDrag: function(e){},						//[Function]
	onDrag: function(e){},								//[Function]
	onStopDrag: function(e){},						//[Function]
});
*/

$(function(MHO) {
	
	var _drag = function() {
		this.status.$proxy.css({
			left: this.status.currentX - this.status.startX + this.status.startX-this.status.startOffsetLeft,
			top: this.status.currentY - this.status.startY + this.status.startY-this.status.startOffsetTop,
		});
	}
	
	var _mouseDown = function(e) {
		this.status.$proxy.css({'position': 'absolute', 'left': this.status.startX-this.status.startOffsetLeft, 'top': this.status.startY-this.status.startOffsetTop});
		this.setting.onStartDrag.call(this, e);
	}
	
	var _mouseMove = function(e) {
		if(this.status.isDragging==false) {return false;}
		$.extend(this.status, {
			currentX: e.pageX,
			currentY: e.pageY
		});
		if(this.setting.onDrag.call(this, e)!=false) {
			_drag.call(this);
		}
	}
	
	var _mouseUp = function(e) {
		_drag.call(this);
		if(this.status.$proxy!=this.$el) {
			this.$el.css({
				'position': this.status.$proxy.css('position'),
				'left': this.status.$proxy.css('left'),
				'top': this.status.$proxy.css('top')
			});
			this.status.$proxy.remove();
		}
		if(this.setting.revert==true) {
			this.$el.css({
				'position': this.status.startPosition,
				'left': this.status.startLeft,
				'top': this.status.startTop
			});
		}
		$.extend(this.status, {
			isDragging: false
		});
		this.setting.onStopDrag.call(this, e);
		$(document).unbind('.draggable');
		$('body').css('cursor', '');
	}
	
	var defaults = {
		$el: $('<div></div>'),								//[$]
		$proxy: null,													//[String|$|Function]
		revert: false,												//[Boolean]
		onBeforeDrag: function(e){},					//[Function]
		onStartDrag: function(e){},						//[Function]
		onDrag: function(e){},								//[Function]
		onStopDrag: function(e){},						//[Function]
	};
	
	var draggable = function(setting) {
		this.setting = $.extend({}, defaults, setting);
		this.status = {
			startPosition: null,
			startTop: null,
			startLeft: null,
			startX: null,
			startY: null,
			startOffsetLeft: null,
			startOffsetTop: null,
			isDragging: false,
			currentX: null,
			currentY: null,
			$proxy: null
		};
		var $el = this.setting.$el.addClass('mho-draggable');
		$.extend(this, {
			$el: $el
		});
		this.init();
	}
	
	$.extend(draggable.prototype, {
		init: function() {
			var that = this;
			this.setting.$el
				.bind('mousedown.draggable', function(e) {
					if(that.setting.onBeforeDrag.call(this, e) == false){
						return false;
					}
					$.extend(that.status, {
						startPosition: $(e.currentTarget).css('position'),
						startTop: $(e.currentTarget).position().top,
						startLeft: $(e.currentTarget).position().left,
						startX: e.pageX,
						startY: e.pageY,
						startOffsetLeft: e.pageX - $(e.currentTarget).offset().left,
						startOffsetTop: e.pageY - $(e.currentTarget).offset().top,
						isDragging: true,
						$proxy: (typeof that.setting.$proxy=='function') ? that.setting.$proxy() : (that.setting.$proxy || that.$el)
					});
					$(e.currentTarget).css('cursor', 'move');
					$(document).bind('mousedown.draggable', function(e) {_mouseDown.call(that, e);});
					$(document).bind('mousemove.draggable', function(e) {_mouseMove.call(that, e);});
					$(document).bind('mouseup.draggable', function(e) {_mouseUp.call(that, e);});
				});
		},
		getMoveOffset: function() {
			return {
				x: this.status.currentX - this.status.startX,
				Y: this.status.currentY - this.status.startY
			}
		}
	});
	
	MHO.draggable = draggable;
}(MHO));