# dtEditor

requires:jquery,jquery databale(https://www.datatables.net/)


创建DataTable

```javascript
var columns = [
    {
        title: '<input type="checkbox"/>',
        render: function() {
            return '<input type="checkbox"/>';
        }
    },
    { title: "date", data: "date"}];
    
 $('table').DataTable({columns:columns,data:[]})
```

创建dtEditor:

```javascript
$("table").dtEditor({
    columns: [
        {
            target: 0, //列
            noField: true, //no need get the value
            //编辑状态下,当前列的html
            render: function (cd) {
                return '';
            }
        },
        {
            target: 8,
            render: function (cd) {
                var $h = $('<input type="text" class="form-control"/>').val(cd);
                $h.datetimepicker({
                    autoclose: true,
                    language: 'zh-CN',
                    minView: 2,
                    format: "yyyy-mm-dd"
                });
                return $h;

            },
            //获取值
            get: function ($td) {
                return $td.find('input').val();
            },
            //保存或取消时调用destory移除event等
            destory: function ($td) {
                $td.find('input').datetimepicker('remove');
            }
        }
    ],
    defaultValue: {date:'2017-01-01' }
});
```
或者use UpcEditorSetting

```javascript UpcEditorSetting
$("table").dtEditor({
    columns: [
        new UpcEditorSetting({
            target: 0,
            noField: true
        }),
        new UpcEditorSetting({
                target: 8,
                render: function(cd) {
                    this.$dom = $('<input type="text" class="form-control"/>').val(cd);
                    this.$dom.datetimepicker({
                        autoclose: true,
                        language: 'zh-CN',
                        minView: 2,
                        format: "yyyy-mm-dd"
                    });
                    return this.$dom;

                },
                destroy: function($td) {
                    this.$dom.datetimepicker('remove');
                }
            })
        ],
    defaultValue: {date:'2017-01-01' }
})
```



使用如下api进行新增或编辑：

```javascript
var handler = $("table").dtEditor();

handler.triggerAdd();

handler.triggerEdit(0); //参数为行号或者tr(dom)

var d = handler.getRowData(); //获取当前行数据

handler.triggerSave(d); //保存当前行

handler.triggerCancel(); //取消编辑或新增
```
