CKEDITOR.plugins.add('blogcut', {
    icons: 'blogcut',
    init: function(editor) {
        editor.addCommand('insertBlogCut', {
            exec: function(editor) {
                editor.insertHtml('{{cut}}');
            }
        });
        editor.ui.addButton('BlogCut', {
            label: 'Insert Blog Cut',
            command: 'insertBlogCut',
            toolbar: 'insert'
        });
    }
});