/*!
 * dtEditor.js
 * 
 * @author:upcyoung
 * Licensed MIT © upcyoung
 * @requires:jquery,jquery datatable
 * 编辑模式：inline,只允许一行在编辑状态
 * https://github.com/upcyoung/dtEditor/blob/master/src/dtEditor.js
 */
;
(function ($, window) {


    window.UpcEditorSetting = function (options) {
        var self = this;
        self.target = options.target;
        self.field = options.field;
        self.title = options.title;
        if (options.noField) {
            self.noField = true;
        }
        self.$dom = null;
        self.handlers = [];
        self.render = function () { return ''; };
        if (!self.noField) {
            self.get = function () {
                return $.trim(this.$dom.val());
            };
        }
        if (options.render) {
            this.render = options.render;
        }
        if (options.get) {
            this.get = options.get;
        }
        if (options.destroy) {
            this.destroy = options.destroy;
        }
        if (options.renderAfter) {
            this.renderAfter = options.renderAfter;
        }
        return this;
    };

    //对象缓存
    var allCache = [];

    var tools = {
        findCache: function () {
            var cache = null;
            for (var i = allCache.length - 1; i >= 0 ; i--) {
                if (allCache[i].o && allCache[i].o[0] == this[0]) {
                    cache = allCache[i];
                    break;
                }
            }
            return cache;
        },
        setCache: function (options) {
            var defaultOp = {mode:'pop'};
            var cache = tools.findCache.call(this);
            if (!cache) {
                cache = $.extend(true, {}, defaultOp, options);
                cache.o = this;
                cache.oDataTable = $(this).DataTable();
                allCache.push(cache);
            }
        },
        toggleStatus: function () {
            var node = this.oDataTable.row(this.oTrIndex).node();
            var tr = $(node).show().next();
            if (tr.length > 0) {
                var tds = tr.find("td");
                for (var i = this.columns.length - 1; i >= 0; i--) {
                    if (this.columns[i].destroy) {
                        this.columns[i].destroy($(tds[this.columns[i].target]));
                    }
                }
                tr.remove();
            }
        },
        togglePopStatus: function () {
            var node = this.oDataTable.row(this.oTrIndex).node();
            $(node).show();
            for (var i = this.columns.length - 1; i >= 0; i--) {
                if (this.columns[i].destroy) {
                    this.columns[i].destroy();
                }
            }
            this.pop.empty();
        },
        createPopRow:function(cd,full) {
            var divArr = ['<div class="form-group col-xs-12">'];
            divArr.push('<label class="control-label col-xs-3">' + this.title + ':</label>');
            divArr.push('<div class="input-group col-xs-9">');
            var html = this.render(cd, full);
            
            divArr.push(' </div></div>');
            var $div = $(divArr.join(''));
            if (typeof html == "string") {
                $div.find('.input-group').innerHTML = html; //填充td，编辑状态
            } else {
                $div.find('.input-group').append(html); //jquery对象，直接append
            }
            return $div;
        },
        editing:function() {
            return this.oTrIndex > -1;
        },
        getRowData:function() {
            if (this.oTrIndex >= 0) {
                var dt = this.oDataTable;
                var rd = dt.row(this.oTrIndex).data();
                var node = dt.row(this.oTrIndex).node();
                var tr = $(node).next()[0];
                var aoColumns = dt.settings()[0].aoColumns;
                var columns = this.columns;
                for (var i = columns.length - 1; i >= 0; i--) {
                    if (columns[i].get) {
                        var td = $(tr).find("td")[[columns[i].target]];
                        var d = columns[i].get($(td), $(tr));
                        rd[aoColumns[columns[i].target].data] = d; //重置编辑列的值，使用列的get方法
                    }

                }
                return rd;
            }
            return null;
        },
        save:function(d) {
            this.oDataTable.row(this.oTrIndex).data(d).draw();
            //var page = dt.page.info();
            //dt.page(page.pages - 1).draw('page');
            this.oTrIndex = -1;
            this.op = "";
        },
        cancel:function() {
            if (this.op == "add") {
                this.oDataTable.row(this.oTr).remove().draw();
            }
            this.oTrIndex = -1;
            this.op = "";
        },
        add:function(value) {
            if (this.oTrIndex >= 0) {
                if (typeof this.message == 'function') {
                    this.message("有未保存的数据,请先保存！");
                } else {
                    alert("有未保存的数据,请先保存！");
                }
                return null;
            }
            var tr = this.oDataTable.row.add($.extend({}, this.defaultValue, value)).draw();
            this.op = "add";
            return tr;
        },
        edit:function(tr,accessor) {
            if (this.oTrIndex >= 0) {
                if (typeof this.message == 'function') {
                    this.message("有未保存的数据,请先保存！");
                } else {
                    alert("有未保存的数据,请先保存！");
                }
                return;
            }
            var row = this.oDataTable.row(tr);
            var index = row.index(); //row在table中的索引
            if (index != this.oTrIndex) {
                accessor(index, tr, row,this);
                this.oTrIndex = index; //成功渲染后记录当前行
                this.oTr = tr;
            }
        },
        inlineAccessor: function (index, tr, row, cache) {
            var dt = cache.oDataTable;
            var rowClone = $(row.node()).clone(); //clone当前行的node
            var columns = cache.columns;
            $(row.node()).hide();
            $(row.node()).after(rowClone);
            var tds = rowClone.find("td");
            var rd = row.data();
            //对每一列，激活编辑模式
            for (var i = cache.columns.length - 1; i >= 0; i--) {
                var coordinate = { row: index, column: columns[i].target };
                var cell = dt.cell(coordinate); //取得cell
                var td = tds[columns[i].target];
                var cd = null;
                if (!columns[i].noField) {
                    cd = cell.data();
                }
                var html = columns[i].render(cd, rd, $(tr)); //调用render方法，获取填充td的html
                if (typeof html == "string") {
                    td.innerHTML = html; //填充td，编辑状态
                } else {
                    $(td).empty().append(html); //jquery对象，直接append
                }
                if (columns[i].renderAfter) { //html渲染完之后，执行回调
                    columns[i].renderAfter(cd, rd, $(tr));
                }
            }
        },
        popAccessor: function (index, tr, row, cache) {
            var columns = cache.columns;
            cache.pop.empty();
            if (cache.op == "add") {
                $(row.node()).hide();
            }
            var rd = row.data();
            for (var i = 0,l=columns.length; i < l; i++) {
                
                if (!columns[i].noField) {
                    var coordinate = { row: index, column: columns[i].target };
                    var cell = cache.oDataTable.cell(coordinate); //取得cell
                    var cd = cell.data();
                    var html = tools.createPopRow.call(columns[i], cd, rd);
                    cache.pop.append(html); //jquery对象，直接append
                    if (columns[i].renderAfter) {
                        columns[i].renderAfter(cd, rd);
                    }
                }
            }
        }
    };



    $.fn.dtEditor = function(options) {
        var self = this;
        if (options && typeof options == "object") {
            tools.setCache.call(self, options);
            return this;
        } else {
            var cache = tools.findCache.call(self);
            var dt = cache.oDataTable;
            if (dt.search() && dt.search() != "") {
                dt.search("").draw();
            }
            //不会返回调用方法的对象，返回handler
            var editorHandler = {
                resetMode: function (mode) {
                    cache.mode = mode;
                },
                triggerEdit: function(tr) {
                    if (cache.mode == 'inline') {
                        tools.edit.call(cache, tr, tools.inlineAccessor);
                    } else {
                        tools.edit.call(cache, tr, tools.popAccessor);
                    }
                },
                triggerAdd: function(value) {
                    var tr = tools.add.call(cache, value);
                    if (tr) {
                        editorHandler.triggerEdit(tr);
                    }        
                },
                triggerSave: function (d) {
                    if (cache.mode == 'inline') {
                        tools.toggleStatus.call(cache);
                    } else {
                        tools.togglePopStatus.call(cache);
                    }
                    tools.save.call(cache,d);
                },
                editing: function() {
                    return tools.editing.call(cache);
                },
                getRowData: function() {
                    return tools.getRowData.call(cache);
                },
                triggerCancel: function () {
                    if (cache.mode == 'inline') {
                        tools.toggleStatus.call(cache);
                    } else {
                        tools.togglePopStatus.call(cache);
                    }   
                    tools.cancel.call(cache);
                }
            };
            return editorHandler;
        }
    };

})(jQuery, window);
