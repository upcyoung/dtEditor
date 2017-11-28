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
(function ($, window, document, undefined) {


    window.UpcEditorSetting = function (options) {
        var self = this;
        self.target = options.target;
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
                if (allCache[i].oTable && allCache[i].oTable[0] == this[0]) {
                    cache = allCache[i];
                    break;
                }
            }
            return cache;
        },
        setCache: function (options) {
            var defaultOp = {};
            var cache = tools.findCache.call(this);
            if (!cache) {
                cache = $.extend(true, {}, defaultOp, options);
                cache.oTable = this;
                cache.oDataTable = $(this).DataTable();
                allCache.push(cache);
            }
        },
        toggleStatus: function (dt) {
            var node = dt.row(this.oTrIndex).node();
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
        }
    };

    $.fn.extend({
        dtEditor: function (options) {
            var self = this;
            if (options && typeof options == "object") {
                tools.setCache.call(self, options);
                return this;
            } else {
                var cache = tools.findCache.call(self);
                var dt = cache.oDataTable;
                if (dt.search()&&dt.search()!="") {
                    dt.search("").draw();
                }
                //不会返回调用方法的对象，返回handler
                var editorHandler = {
                    triggerEdit: function (tr) {
                        if (cache.oTrIndex >= 0) {
                            alert("有未保存的数据,请先保存！");
                            return;
                        }
                        var row = dt.row(tr);
                        var rowClone = $(row.node()).clone();//clone当前行的node
                        var index = row.index(); //row在table中的索引
                        if (index != cache.oTrIndex) {
                            var columns = cache.columns;
                            $(row.node()).hide();
                            $(row.node()).after(rowClone);
                            var tds = rowClone.find("td");
                            //对每一列，激活编辑模式
                            for (var i = cache.columns.length - 1; i >= 0; i--) {
                                var coordinate = { row: index, column: columns[i].target };
                                var cell = dt.cell(coordinate); //取得cell
                                var td = tds[columns[i].target];
                                var cd = null;
                                if (!columns[i].noField) {
                                    cd = cell.data();
                                }
                                var html = columns[i].render(cd, row.data(),$(tr)); //调用render方法，获取填充td的html
                                if (typeof html == "string") {
                                    td.innerHTML = html; //填充td，编辑状态
                                } else {
                                    $(td).empty().append(html); //jquery对象，直接append
                                }
                                if (columns[i].renderAfter) { //html渲染完之后，执行回调
                                    columns[i].renderAfter(cd,$(td),$(tr));
                                }
                            }
                            cache.oTrIndex = index; //成功渲染后记录当前行
                            cache.oTr = tr;
                        }
                    },
                    triggerAdd: function (value) {
                        if (cache.oTrIndex >= 0) {
                            //tools.toggleStatus.call(cache.oTrIndex, dt);
                            alert("有未保存的数据,请先保存！");
                            return;
                        }
                        var tr = dt.row.add($.extend({}, cache.defaultValue,value)).draw();
                        var page = dt.page.info();
                        if (page.pages > 1) {
                            dt.page(page.pages - 1).draw('page');
                        }
                        cache.op = "add";
                        editorHandler.triggerEdit(tr);
                    },
                    triggerSave: function (d) {
                        dt.row(cache.oTrIndex).data(d);
                        //var page = dt.page.info();
                        //dt.page(page.pages - 1).draw('page');
                        tools.toggleStatus.call(cache, dt);
                        cache.oTrIndex = -1;
                        cache.op = "";
                    },
                    getRowData: function () {
                        if (cache.oTrIndex >= 0) {
                            var rd = dt.row(cache.oTrIndex).data();
                            var node = dt.row(cache.oTrIndex).node();
                            var tr = $(node).next()[0];
                            var aoColumns = dt.settings()[0].aoColumns;
                            var columns = cache.columns;
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
                    triggerCancel: function () {
                        tools.toggleStatus.call(cache, dt);
                        //var page = dt.page.info();
                        if (cache.op == "add") {
                            dt.row(cache.oTr).remove().draw();
                        }
                        cache.oTrIndex = -1;
                        cache.op = "";
                    },
                    triggerDelete: function (tr) {
                        dt.row(tr).remove().draw();
                    }

                };
                return editorHandler;
            }
        }
    });

})(jQuery, window, document);
