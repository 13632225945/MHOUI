/*
new resizable({
	$el: $('<div></div>'),						//[$]
	direction: null,									//[String] 'h'|'v'
	edge: 5,													//[Number]
	minWidth: 10,											//[Number]
	minHeight: 10,										//[Number]
	maxWidth: 10000,									//[Number]
	maxHeight: 10000,									//[Number]
	onStartResize: function(e){},			//[Function]
	onResize: function(e){},					//[Function]
	onStopResize: function(e){},			//[Function]
});
*/
$(function(MHO) {
	
	//公共方法=========================================================================
	//获取鼠标距离元素4边距离，
	//若传参$el则取$el作为计算元素，否则取$(e.currentTarget)作为计算元素
	//返回四个距离值
	var getPosition = function(e, $el) {
		var offset = $el?$el.offset():$(e.currentTarget).offset();
		var width = $el?$el.outerWidth():$(e.currentTarget).outerWidth();
		var height = $el?$el.outerHeight():$(e.currentTarget).outerHeight();
		var eX = e.pageX;
		var eY = e.pageY;
		return {
			top: eY - offset.top,
			bottom: offset.top + height - eY,
			left: eX - offset.left,
			right: offset.left + width - eX
		};
	}
	
	//私有方法==============================================================================
	var _getDir = function(e) {
		var position = getPosition(e);
		var dir = '';
		if(position.right<=this.setting.edge&&position.bottom>this.setting.edge&&this.setting.direction!='v') {
			dir = 'e';
		}else if(position.right>this.setting.edge&&position.bottom<=this.setting.edge&&this.setting.direction!='h') {
			dir = 's';
		}else if(position.right<=this.setting.edge&&position.bottom<=this.setting.edge&&this.setting.direction!='h'&&this.setting.direction!='v') {
			dir = 'se';
		}
		return dir;
	}
	
	var _resize = function() {
		var width = this.status.startWidth+this.status.currentX-this.status.startX;
		var height = this.status.startHeight+this.status.currentY-this.status.startY;
		var minWidth = this.setting.minWidth;
		var minHeight = this.setting.minHeight;
		var maxWidth = this.setting.maxWidth;
		var maxHeight = this.setting.maxHeight;
		if(this.status.dir=='se') {
			(width>minWidth&&width<maxWidth)&&this.setting.$el.outerWidth(width);
			(height>minHeight&&height<maxHeight)&&this.setting.$el.outerHeight(height);
		}else if(this.status.dir=='s') {
			(height>minHeight&&height<maxHeight)&&this.setting.$el.outerHeight(height);
		}else if(this.status.dir=='e') {
			(width>minWidth&&width<maxWidth)&&this.setting.$el.outerWidth(width);
		}
	}
	
	var _mouseDown = function(e) {
		this.setting.onStartResize.call(this, e);
	}
	
	var _mouseMove = function(e) {
		if(this.status.isResizing==false) {return false;}
		$.extend(this.status, {
			currentX: e.pageX,
			currentY: e.pageY
		});
		if(this.setting.onResize.call(this, e)!=false) {
			_resize.call(this);
		}
	}
	
	var _mouseUp = function(e) {
		$.extend(this.status, {
			isResizing: false
		});
		_resize.call(this);
		this.setting.onStopResize.call(this, e);
		$(document).unbind('.resizable');
		$('body').css('cursor', '');
	}
	
	var defaults = {
		$el: $('<div></div>'),						//[$]
		direction: null,									//[String] 'h'|'v'
		edge: 5,													//[Number]
		minWidth: 10,											//[Number]
		minHeight: 10,										//[Number]
		maxWidth: 10000,									//[Number]
		maxHeight: 10000,									//[Number]
		onStartResize: function(e){},			//[Function]
		onResize: function(e){},					//[Function]
		onStopResize: function(e){},			//[Function]
	};
	
	var resizable = function(setting) {
		this.setting = $.extend({}, defaults, setting);
		this.status = {
			startWidth: null,
			startHeight: null,
			startX: null,
			startY: null,
			currentX: null,
			currentY: null,
			isResizing: false,
			dir: null
		};
		var $el = this.setting.$el.addClass('mho-resizable');
		$.extend(this, {
			$el: $el
		});
		this.init();
	}
	
	resizable.prototype = {
		init: function() {
			var that = this;
			this.setting.$el
				.bind('mousemove.resizable', function(e) {
					var dir = _getDir.call(that, e);
					$(e.currentTarget).css('cursor', dir?dir+'-resize':'');
				})
				.bind('mousedown.resizable', function(e) {
					var dir = _getDir.call(that, e);
					if(!dir) {return;}
					$.extend(that.status, {
						startWidth: that.setting.$el.outerWidth(),
						startHeight: that.setting.$el.outerHeight(),
						startX: e.pageX,
						startY: e.pageY,
						isResizing: true,
						dir: dir
					});
					$(document).bind('mousedown.resizable', function(e) {_mouseDown.call(that, e);});
					$(document).bind('mousemove.resizable', function(e) {_mouseMove.call(that, e);});
					$(document).bind('mouseup.resizable', function(e) {_mouseUp.call(that, e);});
				});
		}
	};
	
	MHO.resizable = resizable;
}(MHO));