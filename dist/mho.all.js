var MHO = {};
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
/*
tips: 
	定义columns时，保证最后一行没有跨列单元格
	width属性避免定义成百分比值
new table({
	$el: null,		                      //[$]
  className: '',                      //[String]
	width: null,							          //[Number]
	height: null,							          //[Number]
	fit: false,								          //[Boolean]
  resize: false,                      //[Boolean]
	rownumbers: false,				          //[Boolean]
	checkboxs: false,					          //[Boolean]
	singleSelect: false,			          //[Boolean]
	checkOnSelect: false,			          //[Boolean]
	rowStyler: function(row) {},				//[Function]
  frozenColumns: [[]],                //[Array]
	columns: [[]],						          //[Array]
	data: null,								          //[Array]
	url: null,													//[String]
	pagable: false,											//[Boolean]
	pageSize: 30,												//[Number]
	page: 1,														//[Number]
  onLoadSuccess: null,                //[Function]
  onClickRow: function(row) {},       //[Function]
	onSelect: function(row) {},					//[Function]
});
columns: [
	{
		field: null,						//[String]
		text: null,							//[String]
		width: null,						//[Number]
		colspan: null,					//[Number]
		rowspan: null,					//[Number]
		sortable: null,					//[Boolean]
		formatter: null,				//[Function](index, value, row, $td)
	}
]
*/
$(function(MHO) {
	
	var _cid = 0;
	
	//公共方法======================================================================
	var addRules = function($style, rules) {
		for(var ruleName in rules) {
			$style.append('\n'+ruleName+'{'+rules[ruleName]+'}');
		}
	}
	var getRule = function($style, ruleName) {
		var sheet = $style[0].styleSheet ? $style[0].styleSheet : $style[0].sheet;
		var rules = sheet.cssRules || sheet.rules;
		var rule;
		$.each(rules, function(i, r) {
			if(r.selectorText==ruleName) {rule=r;return;}
		});
		return rule;
	}
	var setRules = function($style, rules) {
		for(var ruleName in rules) {
			var rule = getRule($style, ruleName);
			for(var styleName in rules[ruleName]) {
				rule.style[styleName] = rules[ruleName][styleName];
			}
		}
	}
	var removeRule = function($style, ruleName) {
		
	}
	
	var cmpAsc = function(a, b) {
		if (a > b) return +1;
		if (a < b) return -1;
		return 0;
	}
	var cmpDesc = function(a, b) {
		if (a > b) return -1;
		if (a < b) return +1;
		return 0;
	}
  
  //私有方法==========================================================================
  var _renderHeader = function($table, columns, isFrozen) {
    var that = this;
    $.each(columns, function(i, row) {
      var $row = $('<tr></tr>').appendTo($table);
      $.each(row, function(j, column) {
				column.width || (column.width = 80);
        var attr = 'colspan='+column.colspan+' rowspan='+column.rowspan+' data-field="'+column.field+'" title="'+column.text+'"';
        var $td = $('<td '+attr+'></td>').appendTo($row);
        var className = 'mho-table-cell-filed-'+column.field;
        var $cell = $('<div class="'+(column.colspan>1?'mho-table-cell-group':'mho-table-cell '+className)+'">'+column.text+'</div>').appendTo($td);
				var $tools = column.colspan>1 ? '' : $('<div class="mho-table-header-tools"><div class="mho-table-sort-icon"></div></div>').appendTo($td);
        var rule = {};
				var ruleName = '.cid-'+that._cid+' .'+className;
				var ruleValue = 'width:'+column.width+'px;';
        rule[ruleName] = ruleValue;
        addRules(that.$style, rule);
      });
    });
		$table.find('.mho-table-header-tools').click(function() {
			var field = $(this).closest('td').attr('data-field');
			if($(this).find('.mho-table-sort-icon').hasClass('asc')) {
				$(this).find('.mho-table-sort-icon').addClass('desc').removeClass('asc');
				that.sort(field, -1);
			}else {
				$(this).find('.mho-table-sort-icon').addClass('asc').removeClass('desc');
				that.sort(field, 1);
			}
		});
    $table.find('.mho-table-cell').each(function (i, v) {
      var r = new MHO.resizable({
        $el: $(v),												//[$]
        direction: 'h',										//[String] 'h'|'v'
        edge: 5,													//[Number]
        minWidth: 10,											//[Number]
        minHeight: 10,										//[Number]
        maxWidth: 10000,									//[Number]
        maxHeight: 10000,									//[Number]
        onStartResize: function(e){},			//[Function]
        onResize: function(e){
          that.$proxy.css({'left':e.pageX-that.$el.offset().left}).show();
          window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty(); 
          return false;
        },					                      //[Function]
        onStopResize: function(e){
					_resize.call(that, true, false, false);
					var ruleName = '.cid-'+that._cid+' .'+this.$el[0].className.split(' ')[1];
					var rule = {};
					rule[ruleName] = {width: this.$el.outerWidth()+'px'};
					setRules(that.$style, rule);
          that.$proxy.hide();
					this.$el[0].style.width = '';
        },			                          //[Function]
      });
    });
		
		$table.find('.mho-table-cell').add($table.find('.mho-table-cell-group')).each(function (i, v) {
      var left,right;
			new MHO.draggable({
				$el: $(v),													//[$]
				$proxy: function() {
					return $(v).clone(true).css({
            'background': '#6e6e6e',
            'width': $(v).outerWidth(),
            'height': $(v).outerHeight(),
            'text-align': $(v).css('text-align')
          }).appendTo('body');
				},																		//[String|$|Function]
				revert: true,													//[Boolean]
				onBeforeDrag: function(e){
					if(e.pageX>$(v).offset().left+$(v).outerWidth()-5){return false;}
					window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty(); 
				},																		//[Function]
				onStartDrag: function(e){
          var current = $(v).closest('td')[0];
          var throughs = [];
          $(v).closest('table').find('tr').each(function(i, tr) {
            $(tr).find('td').each(function(j, td) {
              var left = $(td).offset().left;
              var right = $(td).offset().left+$(td).outerWidth();
              var center = left+$(td).outerWidth()/2;
              if(e.pageX>left&&e.pageX<right) {
                throughs.push(td);
              }
            });
          });
          $.each(throughs, function(i, t) {
            if(current==t) {
              if(throughs[i-1]) {
                left = $(throughs[i-1]).offset().left;
                right = $(throughs[i-1]).offset().left+$(throughs[i-1]).outerWidth();
              }              
            }
          });
        },						                        //[Function]
				onDrag: function(e){
					//that.$proxy.css({'left':e.pageX-that.$el.offset().left}).show();
					var current = $(v).closest('td')[0];
					var ex = e.pageX;
					var tos = _getTos.call(that, ex<that.$table1.offset().left+that.$table1.outerWidth(), ex, current);
					var el;
					$.each(tos.toHeaders, function(i, v) {
						if(v) {el = v; return;}
					});
					if(el) {
						that.$proxy.css({'left': $(el).offset().left+$(el).outerWidth()-that.$el.offset().left-2}).show();
					}else {
						that.$proxy.hide();
					}
					if(left&&right) {
            if(ex<left||ex>right) {
              that.$proxy.hide();
            }
          }
					var x = that.$body2.offset().left+that.$body2.outerWidth();
					that.$body2.scrollLeft(e.pageX-x);
					window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty(); 
				},																		//[Function]
				onStopDrag: function(e){
					var current = $(v).closest('td')[0];
					var ex = e.pageX;
          var moveFrozen;
          var toFrozen;
          var moves;
          var tos;
          
          if(left&&right) {
            if(ex<left||ex>right) {
              that.$proxy.hide();
              return false;
            }
          }
          
          if($(v).closest('.mho-table-header').parent('div').hasClass('mho-table1')) {
            moveFrozen = true;
          }else {
            moveFrozen = false;
          }
          if(ex<that.$table1.offset().left+that.$table1.outerWidth()) {
            toFrozen = true;
          }else {
            toFrozen = false;
          }
          
          moves = _getMoves.call(that, moveFrozen, current);
          
          tos = _getTos.call(that, toFrozen, ex, current);
          
					var flag = false;
					var moveFirst,toFirst;
					
          $.each(tos.toHeaders, function(i, v) { if(v) {flag=true;} });
          $.each(tos.toBodys, function(i, v) { if(v) {flag=true;} });
					$.each(moves.moveHeaders, function(i, v) {
						if(moveFirst) {return;}
						$.each(v, function(j, v1) {moveFirst=v1;return;});
					});
					$.each(tos.toHeaders, function(i, v) { if(v) {toFirst=v;return;} });
					if(!flag||moveFirst==toFirst) {that.$proxy.hide();return false;}
					
					//move header
					$.each(moves.moveHeaders, function(i, v) {
            for(var j=v.length-1; j>-1; j--) {
              var v1 = v[j];
              if(tos.toHeaders[i]) {
                $(tos.toHeaders[i]).after($(v1));
              }else {
                if(toFrozen) {
                  that.$headerTable1.find('tr').eq(i).prepend($(v1));
                }else {
                  that.$headerTable2.find('tr').eq(i).prepend($(v1));
                }
              }
            }
					});
          //move body
          $.each(moves.moveBodys, function(i, v) {
            for(var j=v.length-1; j>-1; j--) {
              var v1 = v[j];
							if(tos.toBodys[i]&&v1) {
                $(tos.toBodys[i]).after($(v1));
							}
            }
					});
          //move frozen body
          $.each(moves.moveFrozenBodys, function(i, v) {
						for(var j=v.length-1; j>-1; j--) {
              var v1 = v[j];
							if(tos.toFrozenBodys[i]&&v1) {
                $(tos.toFrozenBodys[i]).after($(v1));
							}
						}
					});
					
					_resize.call(that, true, false, false);
					
					that.$proxy.hide();
				},																		//[Function]
			});
		});
    
    var _getMoves = function(isFrozen, current) {
      var that = this;
      var $bodyTable = isFrozen?that.$bodyTable1:that.$bodyTable2;
      var $bodyFrozenTable = isFrozen?that.$bodyFrozenTable1:that.$bodyFrozenTable2;
      var headers = that.getHeaders(isFrozen);
      var moveIndexs = [];
      var moveHeaders = new Array(headers.length);
      var moveBodys = new Array($bodyTable.find('tr').length);
      var moveFrozenBodys = new Array($bodyFrozenTable.find('tr').length);
      $.each(headers, function(i, row) {
        $.each(row, function(j, v) {
          if(current==v) {moveIndexs.push(j);}
        });
      });
      $.each(headers, function(i, row) {
        moveHeaders[i] = [];
        $.each(row, function(j, v) {
          if($.inArray(j, moveIndexs)!=-1) {
            moveHeaders[i].push(v);
          }
        });
      });
      $.each(moveHeaders, function(i, v) {
        $.each(v, function(j, v1) {
          if(v1==v[j-1]) {v[j]=null;}
        });
      });
      $bodyTable.find('tr').each(function(i, tr) {
        moveBodys[i] = [];
        $.each(moveIndexs, function(j, v) {
          moveBodys[i].push($(tr).find('td').eq(v)[0]);
        });
      });
      $bodyFrozenTable.find('tr').each(function(i, tr) {
        moveFrozenBodys[i] = [];
        $.each(moveIndexs, function(j, v) {
          moveFrozenBodys[i].push($(tr).find('td').eq(v)[0]);
        });
      });
      return {
        moveHeaders: moveHeaders,
        moveBodys: moveBodys,
        moveFrozenBodys: moveFrozenBodys
      };
    }
    
    var _getTos = function(isFrozen, ex, current) {
      var that = this;
      var rowNum = $(current).closest('tr').index();
      var $bodyTable = isFrozen?that.$bodyTable1:that.$bodyTable2;
      var $bodyFrozenTable = isFrozen?that.$bodyFrozenTable1:that.$bodyFrozenTable2;
      var headers = that.getHeaders(isFrozen);
      var toIndexs = [];
      var toHeaders = new Array(headers.length);
      var toBodys = new Array($bodyTable.find('tr').length);
      var toFrozenBodys = new Array($bodyFrozenTable.find('tr').length);
      
      var left,right;
      $.each(headers, function(i, row) {
        if(i<=rowNum) {
          $.each(row, function(j, v) {
            if(v) {
              l = $(v).offset().left;
              r = $(v).offset().left+$(v).outerWidth();
              var center = left+$(v).outerWidth()/2;
              if(ex>l&&ex<r) {
                toHeaders[i]= v;
                left = l;
                right = r;
              }
            }
          });
        }else {
          $.each(row, function(j, v) {
            if(v) {
              var _left = $(v).offset().left;
              var _right = $(v).offset().left+$(v).outerWidth();
              if(_left>=left-2&&_right<=right+2) {
                toHeaders[i]= v;
              }
            }
          });
        }
      });
      var el;
      $.each(toHeaders, function(i, v) {
        if(v) {el=v;}
      });
			if(el) {
				$bodyTable.find('tr').each(function(i, tr) {
					$(tr).find('td').each(function(j, td) {
						var l = $(td).offset().left;
						var r = $(td).offset().left+$(td).outerWidth();
						var center = left+$(td).outerWidth()/2;
						if(l>=$(el).offset().left-2&&r<=$(el).offset().left+$(el).outerWidth()+2) {
							toBodys[i]= td;
						}
					});
				});
				$bodyFrozenTable.find('tr').each(function(i, tr) {
					$(tr).find('td').each(function(j, td) {
						var l = $(td).offset().left;
						var r = $(td).offset().left+$(td).outerWidth();
						var center = left+$(td).outerWidth()/2;
						if(l>=$(el).offset().left-2&&r<=$(el).offset().left+$(el).outerWidth()+2) {
							toFrozenBodys[i]= td;
						}
					});
				});
			}
      return {
        toHeaders: toHeaders,
        toBodys: toBodys,
        toFrozenBodys: toFrozenBodys
      };
    }
		
    if(isFrozen) {
			var $td;
      if(this.setting.checkboxs) {
				if(this.setting.singleSelect) {
					$td = $('<td rowspan="' + columns.length + '"><div class="mho-table-header-checkbox">&nbsp;</div></td>');
					if ($('tr', $table).length == 0) {
						$td.wrap('<tr class="mho-table-header-row"></tr>').parent().appendTo($table);
					} else {
						$td.prependTo($('tr:first', $table));
					}
				}else {
					$td = $('<td rowspan="' + columns.length + '"><div class="mho-table-header-checkbox"><input type="checkbox"></div></td>');
					$td.find('input[type="checkbox"]').bind('click', function() {
						$(this).prop('checked') ? that.selectAll() : that.unSelectAll();
					});
					if ($('tr', $table).length == 0) {
						$td.wrap('<tr class="mho-table-header-row"></tr>').parent().appendTo($table);
					} else {
						$td.prependTo($('tr:first', $table));
					}
				}
      }
      if(this.setting.rownumbers) {
        $td = $('<td rowspan="' + columns.length + '"><div class="mho-table-header-rownumber"></div></td>');
        if ($('tr', $table).length == 0) {
          $td.wrap('<tr class="mho-table-header-row"></tr>').parent().appendTo($table);
        } else {
          $td.prependTo($('tr:first', $table));
        }
      }
    }
  }
	var _renderBody = function($table, columns, isFrozen) {
		var that = this;
		var fieldColumns = this.getHeaderFieldColumns(isFrozen);
		if($.isArray(this.setting.data)) {
			this.setting.data = {
				total: this.setting.data.length,
				rows: this.setting.data
			};
		}
		this.$bodyFrozenTable1.empty();
		this.$bodyFrozenTable2.empty();
		$table.empty();
		$.each(this.setting.data.rows, function(j, row) {
			var rowStyler = that.setting.rowStyler ? that.setting.rowStyler(row) : '';
			var $row = $('<tr class="'+rowStyler+'"></tr>').appendTo($table).data({'row': row});
      $row.bind('mouseover', function() {
        if($(this).closest('table')[0]==that.$bodyTable1[0]||$(this).closest('table')[0]==that.$bodyTable2[0]) {
          that.$bodyTable1.find('tr').eq($(this).index()).css({'background': '#ddd'});
          that.$bodyTable2.find('tr').eq($(this).index()).css({'background': '#ddd'});
        }else {
          that.$bodyFrozenTable1.find('tr').eq($(this).index()).css({'background': '#ddd'});
          that.$bodyFrozenTable2.find('tr').eq($(this).index()).css({'background': '#ddd'});
        }
      });
      $row.bind('mouseout', function() {
        if($(this).closest('table')[0]==that.$bodyTable1[0]||$(this).closest('table')[0]==that.$bodyTable2[0]) {
          that.$bodyTable1.find('tr').eq($(this).index()).css({'background': ''});
          that.$bodyTable2.find('tr').eq($(this).index()).css({'background': ''});
        }else {
          that.$bodyFrozenTable1.find('tr').eq($(this).index()).css({'background': ''});
          that.$bodyFrozenTable2.find('tr').eq($(this).index()).css({'background': ''});
        }
      });
      $row.bind('click', function() {
				$row;
				if($(this).closest('table')[0]==that.$bodyTable1[0]||$(this).closest('table')[0]==that.$bodyTable2[0]) {
					$row = that.$bodyTable1.find('tr').eq($(this).index());
				}else {
					$row = that.$bodyFrozenTable1.find('tr').eq($(this).index());
				}
				that.setting.checkOnSelect && $row.find('.mho-table-body-checkbox [type="checkbox"]').click();
        that.setting.onClickRow.call(that, row);
      });
			$.each(fieldColumns, function(i, column) {
        var field = column.field;
        var formatter = column.formatter;
        var value = row[field]?row[field]:'';
				var attr = 'data-field="'+field+'" title="'+value+'"';
				var $td = $('<td '+attr+'></td>').appendTo($row);
        if(formatter) {
          value = formatter.call(this, j, value, row, $td);
        }
				var className = 'mho-table-cell-filed-'+field;
				var $cell = $('<div class="mho-table-cell '+className+'"></div>').append(value).appendTo($td);
			});
			if(isFrozen) {
				var $td;
				if(that.setting.checkboxs) {
					$td = $('<td><div class="mho-table-body-checkbox"><input type="checkbox"></div></td>');
          $td.find('input[type="checkbox"]').bind('click', function(e) {
						e.stopPropagation();
						var checked = $(this).prop('checked');
						var index = that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).index($(this).closest('tr'));
						checked ? that.selectRow(index) : that.unSelectRow(index);
          });
					$td.prependTo($row);
				}
				if(that.setting.rownumbers) {
					$td = $('<td><div class="mho-table-body-rownumber">'+(j+1)+'</div></td>');
					$td.prependTo($row);
				}
			}
		});
	}
	var _resize = function(w, h, isInit) {
		var that = this;
		this.$el.css({width: this.setting.width, height: this.setting.height});
		var $el = this.$el.clone(true).css({'position':'absolute','left':'-10000'}).appendTo($('body'));
		var copy = {
			$el: $el,
			$wrapper: $el.find('.mho-table-wrapper'),
			$table1: $el.find('.mho-table1'),
			$table2: $el.find('.mho-table2'),
			$header1: $el.find('.mho-table1 .mho-table-header'),
			$header2: $el.find('.mho-table2 .mho-table-header'),
			$body1: $el.find('.mho-table1 .mho-table-body'),
			$body2: $el.find('.mho-table2 .mho-table-body'),
			$footer1: $el.find('.mho-table1 .mho-table-footer'),
			$footer2: $el.find('.mho-table2 .mho-table-footer'),
			$headerTable1: $el.find('.mho-table1 .mho-table-header .mho-table-htable'),
			$headerTable2: $el.find('.mho-table2 .mho-table-header .mho-table-htable'),
			$bodyTable1: $el.find('.mho-table1 .mho-table-body .mho-table-btable'),
			$bodyTable2: $el.find('.mho-table2 .mho-table-body .mho-table-btable'),
			$bodyFrozenTable1: $el.find('.mho-table1 .mho-table-body .mho-table-btable-frozen'),
			$bodyFrozenTable2: $el.find('.mho-table2 .mho-table-body .mho-table-btable-frozen'),
      $proxy: $el.find('.mho-table-proxy'),
			$pager: $el.find('.mho-table-pager'),
			$style: $el.find('style')
		};
		if(isInit&&this.setting.fit == true) {
			var totalWidth = copy.$el.outerWidth() - copy.$el.find('.mho-table-header-rownumber').outerWidth() - copy.$el.find('.mho-table-header-checkbox').outerWidth();
			var tWidth = 0;
			fieldColumns = this.getHeaderFieldColumns(true).concat(this.getHeaderFieldColumns(false));
			$.each(fieldColumns, function (i, column) {
				tWidth += column.width;
			});
			$.each(fieldColumns, function (i, column) {
				var width = tWidth<totalWidth ? column.width / tWidth * totalWidth : column.width;
				var ruleName = '.cid-' + that._cid + ' .mho-table-cell-filed-' + column.field;
				var rule = {};
				rule[ruleName] = {width: width + 'px'};
				setRules(that.$style, rule);
			});
		}
		var header1Height = copy.$header1.outerHeight();
		var header2Height = copy.$header2.outerHeight();
		var table1Width = copy.$headerTable1.outerWidth()+1;
		var table2Width = copy.$headerTable2.outerWidth();
		var table1Height = copy.$table1.outerHeight();
		var table2Height = copy.$table2.outerHeight();
		var pagerHeight = copy.$pager.outerHeight();
		if(!this.setting.width) {
			copy.$el.outerWidth(table1Width+table2Width);
			this.$el.outerWidth(table1Width+table2Width);
		}
		if(!this.setting.height) {
			copy.$el.outerHeight(Math.max(table1Height+pagerHeight, table2Height+pagerHeight));
			this.$el.outerHeight(Math.max(table1Height+pagerHeight, table2Height+pagerHeight));
		}
		copy.$wrapper.css({bottom: pagerHeight});
		this.$wrapper.css({bottom: pagerHeight});
		if(w) {
			var width = copy.$el.outerWidth();
			copy.$table1.outerWidth(table1Width);
			this.$table1.outerWidth(table1Width);
			copy.$table2.outerWidth(width-table1Width);
			this.$table2.outerWidth(width-table1Width);
			copy.$table2.outerWidth(width-table1Width);
			this.$table2.outerWidth(width-table1Width);
		}
		if(h) {
      copy.$headerTable1.height(copy.$headerTable2.outerHeight());
      this.$headerTable1.height(copy.$headerTable2.outerHeight());
      copy.$headerTable2.height(copy.$headerTable1.outerHeight());
      this.$headerTable2.height(copy.$headerTable1.outerHeight());
      var height = copy.$el.outerHeight();
			copy.$table1.outerHeight(height-pagerHeight);
			this.$table1.outerHeight(height-pagerHeight);
			copy.$table2.outerHeight(height-pagerHeight);
			this.$table2.outerHeight(height-pagerHeight);
      copy.$bodyFrozenTable1.css({'top': copy.$header1.outerHeight(), 'height': copy.$bodyFrozenTable1.outerHeight()});
      this.$bodyFrozenTable1.css({'top': copy.$header1.outerHeight(), 'height': copy.$bodyFrozenTable1.outerHeight()});
      copy.$bodyFrozenTable2.css({'top': copy.$header2.outerHeight(), 'height': copy.$bodyFrozenTable1.outerHeight()});
      this.$bodyFrozenTable2.css({'top': copy.$header2.outerHeight(), 'height': copy.$bodyFrozenTable1.outerHeight()});
      copy.$body2.css({'margin-top':copy.$bodyFrozenTable2.outerHeight()}).outerHeight(copy.$table2.outerHeight()-copy.$header2.outerHeight()-copy.$footer2.outerHeight()-copy.$bodyFrozenTable2.outerHeight());
			this.$body2.css({'margin-top':copy.$bodyFrozenTable2.outerHeight()}).outerHeight(copy.$table2.outerHeight()-copy.$header2.outerHeight()-copy.$footer2.outerHeight()-copy.$bodyFrozenTable2.outerHeight());
      copy.$body1.css({'margin-top':copy.$bodyFrozenTable1.outerHeight()}).outerHeight(copy.$table1.outerHeight()-copy.$header1.outerHeight()-copy.$footer1.outerHeight()-copy.$bodyFrozenTable1.outerHeight());
			this.$body1.css({'margin-top':copy.$bodyFrozenTable1.outerHeight()}).outerHeight(copy.$table1.outerHeight()-copy.$header1.outerHeight()-copy.$footer1.outerHeight()-copy.$bodyFrozenTable1.outerHeight());
      this.$bodyTable2.css({'height': copy.$bodyTable1.outerHeight()});
		}
		copy.$el.remove();
	}
  
  var _resetNumber = function() {
    var length1 = this.$bodyFrozenTable1.find('tr').length;
    if(this.setting.rownumbers) {
      this.$bodyFrozenTable1.find('tr').each(function(i, tr) {
        $(tr).find('td:eq(0) .mho-table-body-rownumber').html(i+1);
      });
      this.$bodyTable1.find('tr').each(function(i, tr) {
        $(tr).find('td:eq(0) .mho-table-body-rownumber').html(++length1);
      });
    }
  }
	
	var defaults = {
    $el: null,		                      //[$]
		className: '',                      //[String]
		width: null,							          //[Number]
		height: null,							          //[Number]
		fit: false,								          //[Boolean]
		resize: false,                      //[Boolean]
		rownumbers: false,				          //[Boolean]
		checkboxs: false,					          //[Boolean]
		singleSelect: false,			          //[Boolean]
		checkOnSelect: false,			          //[Boolean]
		rowStyler: null,											//[String]
		frozenColumns: [[]],                //[Array]
		columns: [[]],						          //[Array]
		data: null,								          //[Array]
		url: null,													//[String]
		pagable: false,											//[Boolean]
		pageSize: 30,												//[Number]
		page: 1,														//[Number]
		onLoadSuccess: null,                //[Function]
		onClickRow: function(row) {},       //[Function]
		onSelect: function(row) {},					//[Function]
	};
	var table = function(setting) {
		this._cid = _cid++;
		this.setting = $.extend({}, defaults, setting);
		var $el = this.setting.$el ? this.setting.$el : $('<div></div>');
		$el.addClass('mho-table').addClass('cid-'+this._cid).html(
								'<div class="mho-table-wrapper">'+
									'<div class="mho-table1">'+
										'<div class="mho-table-header">'+
											'<table class="mho-table-htable" cellspacing=0 cellpadding=0 border=0></table>'+
										'</div>'+
										'<div class="mho-table-body">'+
											'<table class="mho-table-btable-frozen" cellspacing=0 cellpadding=0 border=0></table>'+
											'<table class="mho-table-btable" cellspacing=0 cellpadding=0 border=0></table>'+
											'<div style="height:20px;width:100%;"></div>'+
										'</div>'+
										'<div class="mho-table-footer"></div>'+
									'</div>'+
									'<div class="mho-table2">'+
										'<div class="mho-table-header">'+
                      '<div style="float: left;width: 10000px;">'+
                        '<table class="mho-table-htable" cellspacing=0 cellpadding=0 border=0></table>'+
                      '</div>'+
										'</div>'+
										'<div class="mho-table-body">'+
											'<table class="mho-table-btable-frozen" cellspacing=0 cellpadding=0 border=0></table>'+
											'<table class="mho-table-btable" cellspacing=0 cellpadding=0 border=0></table>'+
										'</div>'+
										'<div class="mho-table-footer"></div>'+
									'</div>'+
									'<div style="clear:both;"></div>'+
                  '<div class="mho-table-proxy"></div>'+
								'</div>'+
								'<div class="mho-table-pager">'+
									'<ul>'+
										'<li><a href="javascript:void(0)" class="mho-table-page-first">首页</a></li>'+
										'<li>'+
											'<ul class="mho-table-page-number"></ul>'+
										'</li>'+
										'<li><a href="javascript:void(0)" class="mho-table-page-last">尾页</a></li>'+
										'<li><span>共<a class="mho-table-pager-total"></a>条数据</span></li>'+
									'</ul>'+
								'</div>');
		$style = $('<style id="stylesheet'+this._cid+'" type="text/css"></style>');
		$('body').append($style);
		$.extend(this, {
			$el: $el,
			$wrapper: $el.find('.mho-table-wrapper'),
			$table1: $el.find('.mho-table1'),
			$table2: $el.find('.mho-table2'),
			$header1: $el.find('.mho-table1 .mho-table-header'),
			$header2: $el.find('.mho-table2 .mho-table-header'),
			$body1: $el.find('.mho-table1 .mho-table-body'),
			$body2: $el.find('.mho-table2 .mho-table-body'),
			$footer1: $el.find('.mho-table1 .mho-table-footer'),
			$footer2: $el.find('.mho-table2 .mho-table-footer'),
			$headerTable1: $el.find('.mho-table1 .mho-table-header .mho-table-htable'),
			$headerTable2: $el.find('.mho-table2 .mho-table-header .mho-table-htable'),
			$bodyTable1: $el.find('.mho-table1 .mho-table-body .mho-table-btable'),
			$bodyTable2: $el.find('.mho-table2 .mho-table-body .mho-table-btable'),
			$bodyFrozenTable1: $el.find('.mho-table1 .mho-table-body .mho-table-btable-frozen'),
			$bodyFrozenTable2: $el.find('.mho-table2 .mho-table-body .mho-table-btable-frozen'),
      $proxy: $el.find('.mho-table-proxy'),
			$pager: $el.find('.mho-table-pager'),
			$pageNum: $el.find('.mho-table-page-number'),
			$first: $el.find('.mho-table-page-first'),
			$last: $el.find('.mho-table-page-last'),
			$total: $el.find('.mho-table-pager-total'),
			$style: $style
		});
		this.init();
	}
	table.prototype = {
		init: function() {
			this.$el.addClass(this.setting.className);
			if(!this.setting.pagable) {
				this.$pager.remove();
			}
			this._initEvents();
			this._renderHeader();
			if(this.setting.url) {
				this.reload();
			}else {
				this._renderBody();
				this._renderPager();
			}
		},
		_initEvents: function() {
			var that = this;
      this.$body1.bind('mousewheel DOMMouseScroll', function (e) {
        e.preventDefault();
        var e1 = e.originalEvent || window.event;
        var delta = e1.wheelDelta || e1.detail * ( - 1);
        if ('deltaY' in e1) {
          delta = e1.deltaY * - 1;
        }
        that.$body2.scrollTop(that.$body2.scrollTop() - delta);
      });
			this.$body2.bind('scroll', function (e) {
				that.$body1.scrollTop($(this).scrollTop()+0.5);
				that.$header2.scrollLeft($(this).scrollLeft());
				that.$footer2.scrollLeft($(this).scrollLeft());
        that.$bodyFrozenTable2.css({'left': -$(this).scrollLeft()});
			});
			this.$first.bind('click.mho-table-page-first', function(e) {
				that.setting.page = 1;
				that.reload();
			});
			this.$last.bind('click.mho-table-page-last', function(e) {
				var data = that.setting.data,
						total = data.total,
						pageSize = that.setting.pageSize,
						pages = Math.ceil(total/pageSize);
				that.setting.page = pages;
				that.reload();
			});
		},
		_renderHeader: function() {
			_renderHeader.call(this, this.$headerTable1, this.setting.frozenColumns, true);
			_renderHeader.call(this, this.$headerTable2, this.setting.columns, false);
			_resize.call(this, true, false, true);
		},
		_renderBody: function() {
			_renderBody.call(this, this.$bodyTable1, this.setting.frozenColumns, true);
			_renderBody.call(this, this.$bodyTable2, this.setting.columns, false);
      this.setting.onLoadSuccess&&this.setting.onLoadSuccess.call(this, this.setting.data);
			_resize.call(this, false, true, false);
		},
		_renderPager: function() {
			var that = this,
					data = this.setting.data,
					total = data.total,
					page = this.setting.page,
					pageSize = this.setting.pageSize,
					pages = Math.ceil(total/pageSize);
			this.$total.html(this.setting.data.total);
			this.$pageNum.empty();
			for(var i=0; i<pages; i++) {
				this.$pageNum.append('<li><a href="javascript:void(0)">'+(i+1)+'</a></li>');
			}
			this.$pageNum.find('a').click(function() {
				that.gotoPage($(this).html());
			});
		},
    //外部方法==========================================================================
		reload: function() {
			var that = this;
			$.get(this.setting.url, {page: this.setting.page, pageSize: this.setting.pageSize}, function(resp) {
				that.setting.data = resp;
				that._renderPager();
				that._renderBody();
			}, 'json');
		},
		appendTo: function($el) {
			this.$el.appendTo($el);
      return this;
		},
		getHeaders: function(isFrozen) {
			var $rows = isFrozen ? this.$headerTable1.find('tr') : this.$headerTable2.find('tr');
			var _$rows = new Array($rows.length);
			var count = 0;
			$rows.eq(0).find('td').each(function(i, cell) {
				count += parseInt($(cell).attr('colspan')) || 1;
			});
			$.each(_$rows, function(i, row) {
				_$rows[i] = [];
				for(var x=0; x<count; x++) {
					_$rows[i].push(0);
				}
			});
			$rows.each(function(i, row) {
				$(row).find('td').each(function(j, cell) {
					var rowspan = parseInt($(cell).attr('rowspan')) || 1;
					var colspan = parseInt($(cell).attr('colspan')) || 1;
					var index,x;
					if(rowspan>1) {
						if(colspan>1) {
							for(x=i; x<i+rowspan; x++) {
								for(var y=0; y<colspan; y++) {
									index = _$rows[x].indexOf(0);
									_$rows[x][index] = x==i?cell:null;
								}
							}
						}else {
              index = _$rows[i].indexOf(0);
							for(x=i; x<i+rowspan; x++) {
								_$rows[x][index] = x==i?cell:null;
							}
						}
					}else {
						if(colspan>1) {
              for(x=0; x<colspan; x++) {
                index = _$rows[i].indexOf(0);
                _$rows[i][index] = cell;
              }
						}else {
              index = _$rows[i].indexOf(0);
              _$rows[i][index] = cell;
						}
					}
				});
			});
			return _$rows;
		},
		getHeaderFieldColumns: function(isFrozen) {
			var that = this;
			var headers = this.getHeaders(isFrozen);
			if(this.setting.rownumbers&&isFrozen) {
				$.each(headers, function(i, v) {
					v.splice(0, 1);
				});
			}
			if(this.setting.checkboxs&&isFrozen) {
				$.each(headers, function(i, v) {
					v.splice(0, 1);
				});
			}
			var headerColumns = new Array(headers[0].length);
			$.each(headers, function(i, tr) {
				$.each(tr, function(j, td) {
					if(td) {headerColumns[j] = that.getColumnByField($(td).attr('data-field'), isFrozen);}
				});
			});
			return headerColumns;
		},
		getColumnByField: function(field, isFrozen) {
			var columns = isFrozen ? this.setting.frozenColumns : this.setting.columns;
			var column;
			$.each(columns, function(i, row) {
				$.each(row, function(j, col) {
					if(col.field==field) {column = col;}
				});
			});
			return column;
		},
    freezeRow: function(index) {
      this.$bodyFrozenTable1.append(this.$bodyTable1.find('tr').eq(index));
      this.$bodyFrozenTable2.append(this.$bodyTable2.find('tr').eq(index));
      _resetNumber.call(this);
    },
		getFreezeRows: function() {
			var rows = new Array(this.$bodyFrozenTable1.find('tr').length || this.$bodyFrozenTable2.find('tr').length);
			this.$bodyFrozenTable1.find('tr').each(function(i, v) {
				rows[i] = $(v).data('row');
			});
			this.$bodyFrozenTable2.find('tr').each(function(i, v) {
				rows[i] = $(v).data('row');
			});
			return rows;
		},
		sort: function(field, order) {
			var that = this;
			var sortFunc = {
				asc: function(a, b) {return a[field]>b[field];},
				desc: function(a, b) {return a[field]<b[field];}
			};
			var frozenRows = this.getFreezeRows();
			this.setting.data.rows.sort(order==-1?sortFunc.desc:sortFunc.asc);
			_renderBody.call(this, this.$bodyTable1, this.setting.frozenColumns, true);
			_renderBody.call(this, this.$bodyTable2, this.setting.columns, false);
			this.$bodyFrozenTable1.empty();
			this.$bodyFrozenTable2.empty();
			this.$bodyTable1.find('tr').each(function(i, v) {
				$.inArray($(v).data('row'), frozenRows)!=-1&&that.freezeRow(i);
			});
		},
		getSelections: function() {
			var rows = [];
			this.$bodyFrozenTable1.add(this.$bodyTable1).find('tr.mho-table-selected-row').each(function(i, v) {
				rows.push($(v).data('row'));
			});
			this.$bodyFrozenTable2.add(this.$bodyTable2).find('tr.mho-table-selected-row').each(function(i, v) {
				rows[i] || rows.push($(v).data('row'));
			});
			return rows;
		},
		selectRow: function(index) {
			var that = this;
			if(that.setting.singleSelect) {
				that.$bodyTable1.add(that.$bodyTable2).add(that.$bodyFrozenTable1).add(that.$bodyFrozenTable2).find('tr').removeClass('mho-table-selected-row');
				that.$bodyTable1.find('tr .mho-table-body-checkbox [type="checkbox"]').prop('checked', false);
				that.$bodyFrozenTable1.find('tr .mho-table-body-checkbox [type="checkbox"]').prop('checked', false);
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).addClass('mho-table-selected-row');
				that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).eq(index).addClass('mho-table-selected-row');
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', true);
			}else {
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).addClass('mho-table-selected-row');
				that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).eq(index).addClass('mho-table-selected-row');
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', true);
				var allChecked = true;
				that.$bodyFrozenTable1.find('.mho-table-body-checkbox input[type="checkbox"]').
				add(that.$bodyTable1.find('.mho-table-body-checkbox input[type="checkbox"]')).each(function(i, v) {
					if($(v).prop('checked')==false) {allChecked = false;}
				});
				that.$header1.find('.mho-table-header-checkbox input[type="checkbox"]').prop('checked', allChecked);
			}
			that.setting.onSelect && that.setting.onSelect.call(that, that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).data('row'));
		},
		unSelectRow: function(index) {
			var that = this;
			if(that.setting.singleSelect) {
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).removeClass('mho-table-selected-row');
				that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).eq(index).removeClass('mho-table-selected-row');
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', false);
			}else {
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).removeClass('mho-table-selected-row');
				that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).eq(index).removeClass('mho-table-selected-row');
				that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).eq(index).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', false);
				var allChecked = true;
				that.$bodyFrozenTable1.find('.mho-table-body-checkbox input[type="checkbox"]').
				add(that.$bodyTable1.find('.mho-table-body-checkbox input[type="checkbox"]')).each(function(i, v) {
					if($(v).prop('checked')==false) {allChecked = false;}
				});
				that.$header1.find('.mho-table-header-checkbox input[type="checkbox"]').prop('checked', allChecked);
			}
		},
		selectAll: function() {
			var that = this;
			that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).addClass('mho-table-selected-row');
			that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).addClass('mho-table-selected-row');
			that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', true);
			that.$header1.find('.mho-table-header-checkbox input[type="checkbox"]').prop('checked', true);
		},
		unSelectAll: function() {
			var that = this;
			that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).removeClass('mho-table-selected-row');
			that.$bodyFrozenTable2.find('tr').add(that.$bodyTable2.find('tr')).removeClass('mho-table-selected-row');
			that.$bodyFrozenTable1.find('tr').add(that.$bodyTable1.find('tr')).find('.mho-table-body-checkbox [type="checkbox"]').prop('checked', false);
			that.$header1.find('.mho-table-header-checkbox input[type="checkbox"]').prop('checked', false);
		},
		gotoPage: function(page) {
			this.setting.page = page;
			this.reload();
		},
		resize: function(width, height) {
			this.setting.width = width;
			this.setting.height = height;
			_resize.call(this, true, true, true);
		}
	};
	MHO.table = table;
}(MHO));