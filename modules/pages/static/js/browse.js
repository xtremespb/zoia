/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */

(() => {
    let currentDir = '';
    let historyDir = [];
    let spinnerDialog;
    let fileDialog;
    let uploadDialog;
    let fileDialogAction;
    let fileDialogValue;
    let clipboardDir;
    let clipboardData;
    let clipboardOperation;
    let uploader;
    let uploadFailed;

    const templates = {
        d: '<div class="zoia-browse-item zoia-browse-item-d" data="{filename}"><div class="zoia-browse-item-img za-flex za-flex-center za-flex-middle"><span za-icon="icon:folder;ratio:2"></span></div><div class="zoia-browse-item-text"{tooltip}>{filename}</div></div>',
        f: '<div class="zoia-browse-item zoia-browse-item-f" data="{filename}"><div class="zoia-browse-item-img za-flex za-flex-center za-flex-middle">{innerContent}</div><div class="zoia-browse-item-text"{tooltip}>{filename}</div></div>',
        o: ''
    };

    const template = (s, d) => {
        for (let p in d) {
            s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
        }
        return s;
    };

    const setButtonsState = () => {
        $('.zoia-browse-ctl-button').attr('disabled', true);
        $('.zoia-browse-ctl-refresh, .zoia-browse-ctl-upload, .zoia-browse-ctl-newdir').attr('disabled', false);
        const selection = $('#zoia-browse-content').getSelected('zoia-browse-item-selected');
        if (selection.length) {
            if (selection.length === 1) {
                $('.zoia-browse-ctl-rename').attr('disabled', false);
                if ($('.zoia-browse-item[data="' + selection[0] + '"]').hasClass('zoia-browse-item-f')) {
                    $('#zoiaBrowseSelectBtn').attr('disabled', false);
                }
            }
            $('.zoia-browse-ctl-delete, .zoia-browse-ctl-cut, .zoia-browse-ctl-copy').attr('disabled', false);
        }
        if (clipboardOperation) {
            $('.zoia-browse-ctl-paste').attr('disabled', false);
        }
        if (currentDir) {
            $('.zoia-browse-ctl-up').attr('disabled', false);
        }
    };

    const shiftySelectHandler = () => {
        setButtonsState();
    };

    const shiftyUnselectHandler = function() {};

    const load = () => {
        spinnerDialog.show();
        $('#zoia-browse-content').html('');
        $.ajax({
            type: 'POST',
            url: '/api/pages/browse/list',
            data: {
                path: (historyDir.join('/') + '/' + currentDir).replace(/^\//, '')
            },
            cache: false
        }).done((res) => {
            spinnerDialog.hide();
            if (res.status === 1) {
                let html = '';
                for (let i in res.files) {
                    let item = res.files[i];
                    let tooltip = '';
                    if (item.filename.length > 14) {
                        tooltip = ' title="' + item.filename + '" za-tooltip="delay:300"';
                    }
                    let innerContent = '';
                    if (item.ext && !item.thumb) {
                        switch (item.ext) {
                            case 'jpg':
                            case 'jpeg':
                            case 'gif':
                            case 'png':
                                innerContent = '<span za-icon="icon:image;ratio:2">';
                                break;
                            default:
                                innerContent = '<span za-icon="icon:file;ratio:2">';
                        }
                    }
                    if (item.thumb) {
                        innerContent = '<img src="/pages/static/storage/' + (historyDir.join('/') + '/' + currentDir).replace(/^\//, '') + '/___tn_' + item.filename + '" class="zoia-browse-item-thumb">';
                    }
                    html += template(templates[item.type], {
                        filename: item.filename,
                        type: item.type,
                        tooltip: tooltip,
                        innerContent: innerContent
                    });
                }
                if (!res.files || !res.files.length) {
                    html = '<div style="padding-left:15px">' + lang['No files to display'] + '</div>';
                }
                $('#zoia-browse-content').html(html);
                $('.zoia-browse-item').dblclick(dblClickHandler);
                $('.zoia-browse-item').on('doubletap', dblClickHandler);
                $('.zoia-browse-item').shifty({
                    className: 'zoia-browse-item-selected',
                    select: function() {
                        shiftySelectHandler();
                    },
                    unselect: function() {
                        shiftyUnselectHandler();
                    }
                });
            } else {
                spinnerDialog.hide();
                switch (res.status) {
                    case -1:
                        $zUI.notification(lang['Directory doesn\'t exists'], {
                            status: 'danger',
                            timeout: 1500
                        });
                        break;
                    default:
                        $zUI.notification(lang['Could not get directory content'], {
                            status: 'danger',
                            timeout: 1500
                        });
                }
            }
        }).fail(() => {
            $zUI.notification(lang['Could not get directory content'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const dblClickHandler = function() {
        if (!$(this).hasClass('zoia-browse-item-d')) {
            return;
        }
        if (currentDir) {
            historyDir.push(currentDir);
        }
        currentDir = $(this).attr('data');
        load();
        setButtonsState();
    };

    const btnUpHandler = (e) => {
        e.preventDefault();
        $('.zoia-browse-item').removeClass('zoia-browse-item-selected');
        if (historyDir.length === 0) {
            currentDir = '';
        } else {
            currentDir = historyDir.pop();
        }
        load();
        setButtonsState();
    };

    const btnNewDirHandler = () => {
        fileDialog.show();
        $('.zoiaFileDialogTitle').html(lang['New folder']);
        $('#zoiaFileDialogInput').focus();
        $('#zoiaFileDialogInput').val('');
        fileDialogAction = 'folder';
    };

    const btnRenameHandler = (name) => {
        fileDialog.show();
        $('.zoiaFileDialogTitle').html(lang['Rename']);
        $('#zoiaFileDialogInput').focus();
        $('#zoiaFileDialogInput').val(name);
        fileDialogAction = 'rename';
        fileDialogValue = name;
    };

    const btnCutCopyHandler = () => {
        const selection = $('#zoia-browse-content').getSelected('zoia-browse-item-selected');
        if (!selection || selection.length === 0) {
            return false;
        }
        $('.zoia-browse-ctl-clipboard').removeClass('za-button-secondary');
        clipboardData = selection;
        clipboardDir = (historyDir.join('/') + '/' + currentDir).replace(/^\//, '');
        return true;
    };

    const btnPasteHandler = () => {
        if (clipboardDir === (historyDir.join('/') + '/' + currentDir).replace(/^\//, '')) {
            $zUI.modal.alert(lang['Cannot paste files to the same directory'], { labels: { ok: lang['OK'] } });
            return;
        }
        if (!clipboardOperation) {
            return;
        }
        spinnerDialog.show();
        $.ajax({
            type: 'POST',
            url: '/api/pages/browse/paste',
            data: {
                pathSource: clipboardDir,
                pathDestination: (historyDir.join('/') + '/' + currentDir).replace(/^\//, ''),
                files: clipboardData,
                operation: clipboardOperation
            },
            cache: false
        }).done((res) => {
            $('.zoia-browse-ctl-clipboard').removeClass('za-button-secondary');
            clipboardData = null;
            clipboardOperation = null;
            clipboardDir = null;
            if (res.status === 1) {
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
                load();
            } else {
                spinnerDialog.hide();
                $zUI.notification(lang['Cannot paste one or more files'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            spinnerDialog.hide();
            $('.zoia-browse-ctl-clipboard').removeClass('za-button-secondary');
            clipboardData = null;
            clipboardOperation = null;
            clipboardDir = null;
            $zUI.notification(lang['Cannot paste one or more files'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const btnDeleteHandler = () => {
        const selection = $('#zoia-browse-content').getSelected('zoia-browse-item-selected');
        if (!selection || selection.length === 0) {
            return;
        }
        $zUI.modal.confirm(lang['You are going to delete the following file(s)'] + ':<br><br>' + selection.join(', '), { labels: { ok: lang['OK'], cancel: lang['Cancel'] } }).then(function() {
            $.ajax({
                type: 'POST',
                url: '/api/pages/browse/delete',
                data: {
                    path: (historyDir.join('/') + '/' + currentDir).replace(/^\//, ''),
                    files: selection
                },
                cache: false
            }).done((res) => {
                if (res.status === 1) {
                    $zUI.notification(lang['Operation was successful'], {
                        status: 'success',
                        timeout: 1500
                    });
                    load();
                } else {
                    spinnerDialog.hide();
                    $zUI.notification(lang['Error while deleting one or more files'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                spinnerDialog.hide();
                $zUI.notification(lang['Error while deleting one or more files'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        });
    };

    const formSubmitHandler = () => {
        let name = $('#zoiaFileDialogInput').val();
        if (!name || typeof name !== 'string' || name.length > 40 || !name.match(/^[a-zA-Z0-9_\-\.;\s]+$/)) {
            $zUI.notification(lang['Invalid name, please use characters and numbers only'], {
                status: 'danger',
                timeout: 1500
            });
            return;
        }
        switch (fileDialogAction) {
            case 'folder':
                fileDialog.hide();
                spinnerDialog.show();
                $.ajax({
                    type: 'POST',
                    url: '/api/pages/browse/folder/create',
                    data: {
                        path: (historyDir.join('/') + '/' + currentDir).replace(/^\//, ''),
                        name: name
                    },
                    cache: false
                }).done((res) => {
                    if (res.status === 1) {
                        $zUI.notification(lang['Operation was successful'], {
                            status: 'success',
                            timeout: 1500
                        });
                        load();
                    } else {
                        spinnerDialog.hide();
                        $zUI.notification(lang['Error while creating new folder'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    spinnerDialog.hide();
                    $zUI.notification(lang['Error while creating new folder'], {
                        status: 'danger',
                        timeout: 1500
                    });
                });
                break;
            case 'rename':
                fileDialog.hide();
                spinnerDialog.show();
                $.ajax({
                    type: 'POST',
                    url: '/api/pages/browse/rename',
                    data: {
                        path: (historyDir.join('/') + '/' + currentDir).replace(/^\//, ''),
                        nameOld: fileDialogValue,
                        nameNew: name
                    },
                    cache: false
                }).done((res) => {
                    if (res.status === 1) {
                        $zUI.notification(lang['Operation was successful'], {
                            status: 'success',
                            timeout: 1500
                        });
                        load();
                    } else {
                        spinnerDialog.hide();
                        $zUI.notification(lang['Could not rename selected file'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    spinnerDialog.hide();
                    $zUI.notification(lang['Could not rename selected file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                });
                break;
            default:
                // Do nothing
        }
    };

    const uploadClearBtnHandler = () => {
        uploader.splice(0);
        $('#zoia-upload-files').html('').hide();
    };

    const uploadStartHandler = () => {
        uploader.settings.multipart_params = {
            dir: (historyDir.join('/') + '/' + currentDir).replace(/^\//, '')
        };
        uploadFailed = false;
        uploader.start();
    };

    const initUploader = () => {
        uploader = new plupload.Uploader({
            browse_button: 'zoia-upload-area',
            runtimes: 'html5,html4',
            url: '/api/pages/browse/upload',
            drop_element: 'zoia-upload-area',
            filters: {
                max_file_size: '100mb'
            }
        });
        uploader.init();
        uploader.bind('FilesAdded', function(up, files) {
            let html = '';
            plupload.each(files, function(file) {
                html += '<div><div class="zoia-upload-files-label">' + file.name + '&nbsp;(' + plupload.formatSize(file.size) + ')</div><progress id="' + file.id + '" class="za-progress" value="0" max="100"></progress></div>';
            });
            $('#zoia-upload-files').html(html);
            $('#zoia-upload-files').show();
        });
        uploader.bind('Error', function() {
            $zUI.notification(lang['Cannot upload'] + ': ' + file.name, {
                status: 'danger',
                timeout: 1500
            });
        });
        uploader.bind('UploadProgress', function(up, file) {
            $('#' + file.id).attr('value', file.percent);
        });
        uploader.bind('FileUploaded', function(upldr, file, object) {
            try {
                let res = JSON.parse(object.response);
                if (res.status !== 1) {
                    uploadFailed = true;
                    $zUI.notification(lang['Cannot upload'] + ': ' + file.name, {
                        status: 'danger',
                        timeout: 1500
                    });
                } else {
                    $('#' + file.id).parent().remove();
                }
            } catch (e) {
                // Ignore
            }
        });
        uploader.bind('UploadComplete', function() {
            if (!uploadFailed) {
                uploadDialog.hide();
            }
            load();
        });
    };

    const getUrlParam = (paramName) => {
        let reParam = new RegExp('(?:[\?&]|&amp;)' + paramName + '=([^&]+)', 'i');
        let match = window.location.search.match(reParam);
        return (match && match.length > 1) ? match[1] : '';
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/pages/${locale}.js`).done(() => {
            spinnerDialog = $zUI.modal('#zoiaSpinnerDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            fileDialog = $zUI.modal('#zoiaFileDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            uploadDialog = $zUI.modal('#zoiaUploadDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            $('#zoia-browse-content').click(function(e) {
                if (e.target.id === 'zoia-browse-content') {
                    $('.zoia-browse-item').removeClass('zoia-browse-item-selected');
                    setButtonsState();
                }
            });
            $('.zoia-browse-ctl-up').click(btnUpHandler);
            $('.zoia-browse-ctl-newdir').click(btnNewDirHandler);
            $('.zoia-browse-ctl-delete').click(btnDeleteHandler);
            $('.zoia-browse-ctl-upload').click(() => {
                uploadFailed = false;
                uploader.splice(0);
                $('#zoia-upload-files').html('').hide();
                uploadDialog.show();
            });
            $('.zoia-browse-ctl-refresh').click(load);
            $('.zoia-browse-ctl-copy').click(() => {
                if (!btnCutCopyHandler()) {
                    return;
                }
                clipboardOperation = 'copy';
                setButtonsState();
                $('.zoia-browse-ctl-copy').addClass('za-button-secondary');
            });
            $('.zoia-browse-ctl-cut').click(() => {
                if (!btnCutCopyHandler()) {
                    return;
                }
                clipboardOperation = 'cut';
                setButtonsState();
                $('.zoia-browse-ctl-cut').addClass('za-button-secondary');
            });
            $('.zoia-browse-ctl-paste').click(btnPasteHandler);
            $('.zoia-browse-ctl-rename').click(() => {
                const selection = $('#zoia-browse-content').getSelected('zoia-browse-item-selected');
                if (!selection.length || selection.length > 1) {
                    return;
                }
                btnRenameHandler(selection[0]);
            });
            $('#zoiaFileDialogForm').submit((e) => {
                e.preventDefault();
                formSubmitHandler();
            });
            $('#btnUploadClear').click(uploadClearBtnHandler);
            $('#btnUpload').click(uploadStartHandler);
            $('#zoiaBrowseCancelBtn').click(() => {
                window.close();
            });
            $('#zoiaBrowseSelectBtn').click(() => {
                const selection = $('#zoia-browse-content').getSelected('zoia-browse-item-selected');
                if (selection.length && selection.length === 1 && $('.zoia-browse-item[data="' + selection[0] + '"]').hasClass('zoia-browse-item-f')) {
                    let url = (historyDir.join('/') + '/' + currentDir + '/' + selection[0]).replace(/\/\//gm, '');
                    if (url.charAt(0) !== '/') {
                        url = '/' + url;
                    }
                    url = '/pages/static/storage' + url;
                    let funcNum = getUrlParam('CKEditorFuncNum');
                    if (window.opener.zoiaCodeMirror) {
                        const doc = window.opener.zoiaCodeMirror.getDoc();
                        const cursor = doc.getCursor();
                        const pos = {
                            line: cursor.line,
                            ch: cursor.ch
                        };
                        doc.replaceRange(`<img src="${url}" alt="">`, pos);
                    } else {
                        window.opener.CKEDITOR.tools.callFunction(funcNum, url);
                    }
                    window.close();
                }
            });
            initUploader();
            load();
            setButtonsState();
        });
    });
})();