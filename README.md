# dtEditor

requires:jquery,jquery databale(https://www.datatables.net/)

使用如下api进行新增或编辑：

```javascript
var handler = $("table").dtEditor();

handler.triggerAdd();

handler.triggerEdit(0); //参数为行号或者tr(dom)

var d = handler.getRowData(); //获取当前行数据

handler.triggerSave(d); //保存当前行

handler.triggerCancel(); //取消编辑或新增
```
