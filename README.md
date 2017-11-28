# dtEditor

requires:jquery,jquery databale(https://www.datatables.net/)


创建DataTable

```javascript

```

创建dtEditor:

```javascript
$("table").dtEditor({
    columns: [
        {
            target: 0,
            noField: true,
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
            get: function ($td) {
                return $td.find('input').val();
            },
            destory: function ($td) {
                $td.find('input').datetimepicker('remove');
            }
        }
    ],
    defaultValue: {date:'2017-01-01' }
});
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
