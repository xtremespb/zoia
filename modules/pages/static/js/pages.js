/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-len: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let deleteDialog;
    let foldersDialog;
    let folderEditDialog;
    let repairDialog;
    let currentEditID;
    let currentDeleteID;
    let foldersTree;
    let repairTree;
    let foldersModified = false;
    let foldersEditMode = false;
    let editShadow = {};
    let editLanguage;
    let codemirror;

    let locale;
    let useCodemirror;
    let langs;
    let templates;
    let foldersData;
    let uprefix;
    let rxp;
    let corePrefix;
    // let testMode;

    const getUrlParam = (sParam) => {
        let sPageURL = decodeURIComponent(window.location.search.substring(1));
        let sURLVariables = sPageURL.split('&');
        let sParameterName;
        let i;
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    const editSpinner = (show) => {
        if (show) {
            $('.editForm-form-button').hide();
            $('#zoiaEditSpinner').show();
        } else {
            $('.editForm-form-button').show();
            $('#zoiaEditSpinner').hide();
        }
    };

    const deleteDialogSpinner = (show) => {
        if (show) {
            $('.zoia-delete-dialog-button').hide();
            $('#zoiaDeleteDialogSpinner').show();
        } else {
            $('.zoia-delete-dialog-button').show();
            $('#zoiaDeleteDialogSpinner').hide();
        }
    };

    const foldersDialogSpinner = (show) => {
        if (show) {
            $('.zoia-folders-dialog-button').hide();
            $('#zoiaFoldersDialogSpinner').show();
        } else {
            $('.zoia-folders-dialog-button').show();
            $('#zoiaFoldersDialogSpinner').hide();
        }
    };

    const repairDialogSpinner = (show) => {
        if (show) {
            $('.zoia-repair-dialog-button').hide();
            $('#zoiaRepairDialogSpinner').show();
        } else {
            $('.zoia-repair-dialog-button').show();
            $('#zoiaRepairDialogSpinner').hide();
        }
    };

    const createItem = () => {
        $('#wrapTable').hide();
        $('#zoiaEdit').show();
        $('#zoiaEditHeader').html(lang.addItem);
        for (let lng in langs) {
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
        }
        $('#editForm').zoiaFormBuilder().resetForm();
        currentEditID = null;
        editLanguage = Object.keys(langs)[0];
        // $('#zoiaEditLanguages > li[data=' + editLanguage + ']').click();
        markZoiaLanguagesTab(editLanguage);
        $('#editForm_content').val('');
        if (useCodemirror && !codemirror) {
            codemirror = CodeMirror.fromTextArea(document.getElementById('editForm_content'), {
                mode: 'htmlmixed',
                lineWrapping: true,
                lineNumbers: true
            });
            window.zoiaCodeMirror = codemirror;
        }
        if (useCodemirror) {
            codemirror.setValue('');
            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
        }
    };

    const showTable = () => {
        $('#wrapTable').show();
        $('#zoiaEdit').hide();
    };

    const editItem = (id) => {
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return showTable();
        }
        currentEditID = id;
        for (let lng in langs) {
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
        }
        $('#wrapTable').hide();
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#zoiaEditHeader').html(lang.editItem);
        editLanguage = Object.keys(langs)[0];
        markZoiaLanguagesTab(editLanguage);
        $('#zoiaSpinnerMain').show();
        $('#editForm').zoiaFormBuilder().loadData({ id: id });
    };

    const deleteItem = (id) => {
        if (!id) {
            return showTable();
        }
        let items = [];
        let names = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                names.push($('#pages').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            names.push($('#pages').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteDialogList').html('');
        for (let n in names) {
            $('#zoiaDeleteDialogList').append('<li>' + names[n] + '</li>');
        }
        deleteDialogSpinner(false);
        deleteDialog.show();
    };

    const ajaxDeleteItem = () => {
        deleteDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/pages/delete',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#pages').zoiaTable().load();
            if (res && res.status === 1) {
                deleteDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteDialogSpinner(false);
            }
        }).fail(() => {
            $('#pages').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteDialogSpinner(false);
        });
    };

    const ajaxRepairDatabase = () => {
        repairDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/pages/repair',
            data: {
                folder: repairTree.jstree(true).get_selected()
            },
            cache: false
        }).done((res) => {
            repairDialogSpinner(false);
            $('#pages').zoiaTable().load();
            if (res && res.status === 1) {
                repairDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot repair one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#pages').zoiaTable().load();
            $zUI.notification(lang['Cannot repair one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            repairDialogSpinner(false);
        });
    };

    const ajaxRebuildDatabase = () => {
        $('#zoiaSpinnerMain').show();
        $.ajax({
            type: 'POST',
            url: '/api/pages/rebuild',
            cache: false
        }).done((res) => {
            $('#zoiaSpinnerMain').hide();
            $('#pages').zoiaTable().load();
            if (res && res.status === 1) {
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot rebuild one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#pages').zoiaTable().load();
            $zUI.notification(lang['Cannot rebuild one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            $('#zoiaSpinnerMain').hide();
        });
    };

    const processState = (eventState) => {
        const state = eventState || {
            action: getUrlParam('action'),
            id: getUrlParam('id')
        };
        switch (state.action) {
            case 'edit':
                editItem(state.id);
                break;
            case 'create':
                createItem();
                break;
            default:
                showTable();
                break;
        }
    };

    const foldersChangedHandler = (e, data) => {
        $('.zoia-folders-btn').attr('disabled', (data.selected.length ? false : true));
        $('#zoiaFoldersDialogButton').attr('disabled', false);
        if (!data.selected.length || data.selected.length > 1) {
            $('#zoiaFoldersAdd').attr('disabled', true);
            $('#zoiaFoldersEdit').attr('disabled', true);
            $('#zoiaFoldersDialogButton').attr('disabled', true);
        }
        for (let i in data.selected) {
            if (foldersTree.jstree(true).get_parent(data.selected[i]) === '#') {
                $('#zoiaFoldersEdit').attr('disabled', true);
                $('#zoiaFoldersDelete').attr('disabled', true);
            }
        }
    };

    const repairChangedHandler = (e, data) => {
        $('#zoiaRepairDialogButton').attr('disabled', !(data.selected.length && data.selected.length === 1));
    };

    const initFoldersTree = (data) => {
        if (foldersTree) {
            foldersTree.jstree(true).destroy();
        }
        foldersTree = $('#zoia_folders_tree').jstree({
            core: {
                check_callback: true,
                data: data || foldersData
            },
            plugins: ['dnd', 'unique', 'types'],
            types: {
                '#': {
                    max_children: 1,
                    valid_children: ['root']
                },
                'root': {
                    valid_children: ['folder']
                },
                'folder': {
                    valid_children: ['folder']
                }
            }
        });
        foldersTree.on('loaded.jstree', () => {
            foldersTree.jstree(true).open_all('#');
            treeFindRoot(foldersTree);
        });
        foldersTree.on('changed.jstree', (e, _data) => {
            foldersChangedHandler(e, _data);
        });
    };

    const initRepairTree = () => {
        if (repairTree) {
            repairTree.jstree(true).destroy();
        }
        repairTree = $('#zoia_repair_tree').jstree({
            core: {
                check_callback: true,
                data: foldersData
            },
            plugins: ['dnd', 'unique', 'types'],
            types: {
                '#': {
                    max_children: 1,
                    valid_children: ['root']
                },
                'root': {
                    valid_children: ['folder']
                },
                'folder': {
                    valid_children: ['folder']
                }
            }
        });
        repairTree.on('loaded.jstree', () => {
            repairTree.jstree(true).open_all('#');
            treeFindRoot(repairTree);
        });
        repairTree.on('changed.jstree', (e, _data) => {
            repairChangedHandler(e, _data);
        });
    };

    const treeFindRoot = (tree) => {
        const fldrs = foldersTree.jstree(true).get_json(tree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        tree.jstree(true).deselect_all();
        for (let i = 0; i < fldrs.length; i++) {
            if (fldrs[i].parent === '#') {
                tree.jstree(true).select_node(fldrs[i].id);
            }
        }
    };

    const serializeFolders = () => {
        let result = foldersTree.jstree(true).get_json(foldersTree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        for (let i in result) {
            delete result[i].li_attr;
            delete result[i].a_attr;
            delete result[i].icon;
            delete result[i].state;
        }
        return result;
    };

    const onSelectedFolder = (sel, path) => {
        foldersDialog.hide();
        $('#editForm_folder_val').attr('data', foldersTree.jstree(true).get_node(sel).id);
        $('#editForm_folder_val').html(path);
        // foldersTree.jstree(true).get_node(sel).id;
    };

    const treePath = (tree, id, _path) => {
        let node = tree.find(x => x.id === id);
        if (!node) {
            return '';
        }
        let path = _path || [];
        path.push(node.text);
        if (node.parent !== '#') {
            path = treePath(tree, node.parent, path);
        }
        return path;
    };

    const onEditLanguageCheckboxClickEvent = () => {
        if ($('#zoiaEditLanguageCheckbox').prop('checked')) {
            $('#editForm').zoiaFormBuilder().resetForm();
            editShadow[editLanguage].enabled = true;
            editShadow[editLanguage].data = {};
            for (let lng in langs) {
                if (editShadow[lng].data) {
                    if (editShadow[lng].data.folder) {
                        $('#editForm_folder_val').html(editShadow[lng].data.folder.value);
                        $('#editForm_folder_val').attr('data', editShadow[lng].data.folder.id);
                    }
                    if (editShadow[lng].data.name) {
                        $('#editForm_name').val(editShadow[lng].data.name.value);
                    }
                    if (editShadow[lng].data.template) {
                        $('#editForm_template').val(editShadow[lng].data.template.value);
                    }
                    if (editShadow[lng].data.status) {
                        $('#editForm_status').val(editShadow[lng].data.status.value);
                    }
                }
            }
            $('#editForm_content').val('');
            $('#editForm').show();
            if (useCodemirror) {
                codemirror.setValue('');
                codemirror.clearHistory();
            }
        } else {
            editShadow[editLanguage].enabled = false;
            if (useCodemirror) {
                codemirror.setValue('');
            }
            $('#editForm').hide();
        }
    };

    const initEditor = () => {
        window.setTimeout(function() {
            if (useCodemirror) {
                $(window).bind('popstate',
                    (event) => {
                        processState(event.originalEvent.state);
                    });
                $(window).resize(function() {
                    if (codemirror) {
                        codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
                    }
                });
                processState();
            } else {
                const ckeditor = $('#editForm_content').ckeditor({
                    filebrowserImageBrowseUrl: uprefix + corePrefix.admin + '/pages/browse',
                    filebrowserBrowseUrl: uprefix + corePrefix.admin + '/pages/browse',
                    filebrowserWindowWidth: 800,
                    filebrowserWindowHeight: 500,
                    allowedContent: true
                }).editor;
                ckeditor.on('instanceReady', function() {
                    $(window).bind('popstate',
                        (event) => {
                            processState(event.originalEvent.state);
                        });
                    processState();
                });
            }
        }, 0);
    };

    const markZoiaLanguagesTab = (n) => {
        $('#zoiaEditLanguages > li').removeClass('za-active');
        $('#zoiaEditLanguages > li[data=' + n + ']').addClass('za-active');
    };

    const onZoiaEditLanguagesClick = (lng) => {
        if (!editShadow[lng].enabled) {
            editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
            editLanguage = lng;
            $('#zoiaEditLanguageCheckbox').prop('checked', false);
            $('#editForm').hide();
            return;
        }
        $('#zoiaEditLanguageCheckbox').prop('checked', true);
        if (lng === editLanguage) {
            return $('#editForm').zoiaFormBuilder().deserialize(editShadow[editLanguage].data);
        }
        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
        if (editShadow[editLanguage].enabled && editShadow[editLanguage].data &&
            editShadow[editLanguage].data.folder && editShadow[editLanguage].data.name &&
            editShadow[editLanguage].data.status) {
            let saveFolder = editShadow[editLanguage].data.folder;
            let saveName = editShadow[editLanguage].data.name;
            let saveStatus = editShadow[editLanguage].data.status;
            let saveTemplate = editShadow[editLanguage].data.template;
            editShadow[lng].data.folder = saveFolder;
            editShadow[lng].data.name = saveName;
            editShadow[lng].data.template = saveTemplate;
            editShadow[lng].data.status = saveStatus;
            if (useCodemirror) {
                editShadow[editLanguage].data.content.value = codemirror.getValue();
            } 
        }
        editLanguage = lng;
        markZoiaLanguagesTab(editLanguage);
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#editForm').zoiaFormBuilder().deserialize(editShadow[editLanguage].data);        
        $('#editForm').show();
        if (useCodemirror) {
            codemirror.setValue(editShadow[editLanguage].data.content.value);
            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
        }
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        useCodemirror = $('#zp_codemirror').attr('data') === 'true' ? true : false;
        uprefix = $('#zp_uprefix').attr('data');
        langs = JSON.parse($('#zp_langs').attr('data'));
        templates = JSON.parse($('#zp_templates').attr('data'));
        foldersData = JSON.parse($('#zp_foldersData').attr('data'));
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        rxp = JSON.parse($('#zp_rxp').attr('data'));
        // testMode = Boolean($('#zp_testMode').attr('data'));
        $.getScript(`/api/lang/pages/${locale}.js`).done(() => {
            deleteDialog = $zUI.modal('#zoiaDeleteDialog', {
                bgClose: false,
                escClose: false
            });
            foldersDialog = $zUI.modal('#zoiaFoldersDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            folderEditDialog = $zUI.modal('#zoiaFolderEditDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            repairDialog = $zUI.modal('#zoiaRepairDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            initFoldersTree();
            $('.zoiaDeleteButton').click(function() {
                const checked = $('.pagesCheckbox:checkbox:checked').map(function() {
                    return this.id;
                }).get();
                if (checked && checked.length > 0) {
                    deleteItem(checked);
                }
            });
            $('#zoiaDeleteDialogButton').click(() => {
                ajaxDeleteItem();
            });
            $('#zoiaRepairDialogButton').click(() => {
                ajaxRepairDatabase();
            });
            $('#editForm').zoiaFormBuilder({
                save: {
                    url: '/api/pages/save',
                    method: 'POST'
                },
                load: {
                    url: '/api/pages/load',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                template: {
                    fields: '{fields}',
                    buttons: '{buttons}'
                },
                html: {
                    helpText: '<div class="za-text-meta">{text}</div>',
                    text: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    select: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><select class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-grid za-grid-small"><div><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="za-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}',
                    buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                    button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                    launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}</div>',
                    textarea: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><textarea class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>'
                },
                events: {
                    onSaveValidate: (data) => {
                        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
                        if (useCodemirror) {
                            editShadow[editLanguage].data.content.value = codemirror.getValue();
                        } 
                        let saveFolder = editShadow[editLanguage].data.folder.id;
                        let saveURL = editShadow[editLanguage].data.folder.value;
                        let saveName = editShadow[editLanguage].data.name.value;
                        let saveTemplate = editShadow[editLanguage].data.template.value;
                        let saveStatus = editShadow[editLanguage].data.status.value;
                        for (let n in editShadow) {
                            if (!editShadow[n].enabled) {
                                continue;
                            }
                            let lngdata = editShadow[n].data;
                            let vr = $('#editForm').zoiaFormBuilder().validate(lngdata);
                            if (Object.keys(vr.errors).length > 0) {
                                markZoiaLanguagesTab(n);
                                onZoiaEditLanguagesClick(n);
                                vr = $('#editForm').zoiaFormBuilder().validate($('#editForm').zoiaFormBuilder().serialize());
                                if ($('#editForm').zoiaFormBuilder().errors(vr.errors)) {
                                    return '__stop';
                                }
                            }
                            vr.data.folder = saveFolder;
                            vr.data.url = (saveURL + '/' + saveName).replace(/^\//, '').replace(/\/$/, '');
                            vr.data.name = saveName;
                            vr.data.template = saveTemplate;
                            vr.data.status = saveStatus;
                            data[n] = vr.data;
                        }
                        data.id = currentEditID;
                        editSpinner(true);
                        return data;
                    },
                    onSaveSuccess: () => {
                        editSpinner(false);
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                        $('#pages').zoiaTable().load();
                        $('#zoiaEdit').hide();
                        $('#wrapTable').show();
                        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/pages');
                    },
                    onSaveError: (res) => {
                        editSpinner(false);
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $zUI.notification(lang.fieldErrors['Page not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $zUI.notification(lang.fieldErrors['Page already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: (data) => {
                        for (let n in langs) {
                            if (!data.item[n]) {
                                data.item[n] = {};
                            }
                            if (Object.keys(data.item[n]).length === 0) {
                                editShadow[n] = {
                                    enabled: false
                                };
                                continue;
                            }
                            editShadow[n] = {
                                enabled: true,
                                data: {}
                            };
                            let path = treePath(foldersData, data.item.folder);
                            if (path) {
                                path = path.reverse().join('/').replace('//', '');
                                if (path === '/') {
                                    path = '';
                                }
                                editShadow[n].data.folder = {
                                    type: 'launcher',
                                    id: data.item.folder,
                                    value: path
                                };
                            } else {
                                editShadow[n].data.folder = {
                                    type: 'launcher',
                                    id: 1,
                                    value: '<div za-icon="icon:ban" style="padding-top:4px"></div>'
                                };
                            }
                            editShadow[n].data.name = {
                                type: 'text',
                                value: data.item.name
                            };
                            editShadow[n].data.title = {
                                type: 'text',
                                value: data.item[n].title
                            };
                            editShadow[n].data.status = {
                                type: 'select',
                                value: data.item.status
                            };
                            editShadow[n].data.template = {
                                type: 'select',
                                value: data.item.template
                            };
                            editShadow[n].data.keywords = {
                                type: 'text',
                                value: data.item[n].keywords
                            };
                            editShadow[n].data.description = {
                                type: 'text',
                                value: data.item[n].description
                            };
                            editShadow[n].data.content = {
                                type: 'textarea',
                                value: data.item[n].content
                            };
                        }
                        $('#zoiaEditLanguageCheckbox').prop('checked', editShadow[editLanguage].enabled);                        
                        $('#zoiaEdit').show();
                        $('#zoiaSpinnerMain').hide();
                        if (useCodemirror && !codemirror) {
                            codemirror = CodeMirror.fromTextArea(document.getElementById('editForm_content'), {
                                mode: 'htmlmixed',
                                lineWrapping: true,
                                lineNumbers: true
                            });
                            window.zoiaCodeMirror = codemirror;
                            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
                        } 
                        for (let n in langs) {
                            if (editShadow[n].enabled) {
                                $('#zoiaEditLanguages > li[data=' + n + ']').click();
                                if (useCodemirror) {
                                    codemirror.setValue(editShadow[editLanguage].data.content.value);
                                } 
                                break;
                            }
                        }
                    },
                    onLoadError: () => {
                        $('#zoiaSpinnerMain').hide();
                        $zUI.notification(lang['Could not load information from database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                validation: false,
                items: {
                    folder: {
                        type: 'launcher',
                        label: lang['Folder'],
                        labelBtn: lang['Select'],
                        value: '',
                        data: 1
                    },
                    name: {
                        type: 'text',
                        label: lang['Name'],
                        css: 'za-width-medium',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: rxp.pageID,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Characters and numbers only (1-64 chars), leave blank for root page']
                    },
                    title: {
                        type: 'text',
                        label: lang['Title'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Required, max. 128 characters']
                    },
                    status: {
                        type: 'select',
                        label: lang['Status'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.statuses[0],
                            1: lang.statuses[1]
                        },
                        default: '1',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1|2)$/
                        }
                    },
                    template: {
                        type: 'select',
                        label: lang['Template'],
                        css: 'za-form-width-small',
                        values: templates,
                        default: templates[0]
                    },
                    keywords: {
                        type: 'text',
                        label: lang['Keywords'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Optional, max. 128 characters']
                    },
                    description: {
                        type: 'text',
                        label: lang['Description'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Optional, max. 128 characters']
                    },
                    content: {
                        type: 'textarea',
                        label: lang['Content'],
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false
                        },
                        css: 'zoiaFormBuilder-no-reset'
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-edit-buttons-wrap',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default',
                            name: 'btnCancel'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none" id="zoiaEditSpinner"></div>'
                    }
                },
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
                }
            });
            let editFolderFormItems = {
                id: {
                    type: 'text',
                    label: lang['ID'],
                    css: 'za-width-medium',
                    autofocus: true,
                    validation: {
                        mandatoryCreate: true,
                        mandatoryEdit: true,
                        length: {
                            min: 1,
                            max: 64
                        },
                        regexp: rxp.pageFolder,
                        process: (item) => {
                            return item.trim();
                        }
                    }
                }
            };
            for (let lng in langs) {
                editFolderFormItems[lng] = {
                    type: 'text',
                    label: langs[lng],
                    css: 'za-width-large',
                    validation: {
                        mandatoryCreate: false,
                        mandatoryEdit: false,
                        length: {
                            min: 1,
                            max: 64
                        },
                        process: (item) => {
                            return item.trim();
                        }
                    }
                };
                $('#zoiaEditLanguages').append('<li data="' + lng + '"><a href="#">' + langs[lng] + '</a></li>');
                editShadow[lng] = {
                    enabled: true,
                    data: {}
                };
                if (!editLanguage) {
                    editLanguage = lng;
                }
            }
            editFolderFormItems.buttons = {
                type: 'buttons',
                css: 'za-modal-footer za-text-right',
                buttons: [{
                    label: lang['Cancel'],
                    css: 'za-button-default za-modal-close'
                }, {
                    name: 'btnSave',
                    label: lang['Save'],
                    css: 'za-button-primary',
                    type: 'submit'
                }],
                html: '<div za-spinner style="float:right;display:none" id="zoiaEditDialogSpinner"></div>'
            };
            $('#editFolderForm').zoiaFormBuilder({
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                formDangerClass: 'za-form-danger',
                html: {
                    helpText: '<div class="za-text-meta">{text}</div>',
                    text: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    select: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><select class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-grid za-grid-small"><div><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="za-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}',
                    buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                    button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                    launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}</div>',
                    textarea: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><textarea class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>'
                },
                events: {
                    onSaveValidate: () => {
                        let sel = foldersTree.jstree(true).get_selected();
                        if (foldersEditMode) {
                            foldersTree.jstree(true).rename_node(sel, $('#editFolderForm_id').val());
                            foldersTree.jstree(true).get_node(sel).data = {};
                            foldersTree.jstree(true).get_node(sel).data.lang = {};
                            for (let lng in langs) {
                                foldersTree.jstree(true).get_node(sel).data.lang[lng] = $('#editFolderForm_' + lng).val();
                            }
                            foldersTree.jstree(true).open_node(sel);
                            folderEditDialog.hide();
                            foldersModified = true;
                        } else {
                            let cn = foldersTree.jstree(true).create_node(sel, {
                                id: Date.now() / 1000 | 0,
                                text: $('#editFolderForm_id').val(),
                                type: 'folder'
                            });
                            if (!cn) {
                                $zUI.notification(lang['Duplicate folder'], {
                                    status: 'danger',
                                    timeout: 1500
                                });
                                $('#editFolderForm_id').focus();
                                return '__stop';
                            }
                            foldersTree.jstree(true).get_node(cn).data = {};
                            foldersTree.jstree(true).get_node(cn).data.lang = {};
                            for (let lng in langs) {
                                foldersTree.jstree(true).get_node(cn).data.lang[lng] = $('#editFolderForm_' + lng).val();
                            }
                            foldersTree.jstree(true).open_node(sel);
                            folderEditDialog.hide();
                            foldersModified = true;
                        }
                        return '__stop';
                    }
                },
                items: editFolderFormItems,
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
                }
            });
            $('#pages').zoiaTable({
                url: '/api/pages/list',
                limit: 20,
                sort: {
                    field: 'name',
                    direction: 'asc'
                },
                fields: {
                    name: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    folder: {
                        sortable: true,
                        process: (id, item, value) => {
                            let path = treePath(foldersData, value);
                            if (path) {
                                path = path.reverse().join('/').replace('//', '');
                                if (path.length > 1) {
                                    path += '/';
                                }
                                let result = '';
                                if (path) {
                                    result = '<div class="zoia-folder-column" title="' + path + '">' + path + '</div>';
                                } else {
                                    result = '<span za-icon="icon:ban"></span>';
                                }
                                return result;
                            }
                            return '<span za-icon="icon:ban"></span>';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.statuses[value] || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-pages-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-pages-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-pages-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/pages?action=edit&id=' + $(this).attr('data'));
                        editItem($(this).attr('data'));
                    });
                    $('.zoia-pages-action-del-btn').click(function() {
                        deleteItem($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            if (useCodemirror) {
                $('#editForm_content').parent().prepend('<div class="za-width-1-1" style="height:40px"><span href="" class="za-icon-button" za-icon="image" style="margin-right:3px" id="zoia_codemirror_image" za-tooltip="' + lang['Insert Image'] + '"></span></div>');
                $('#zoia_codemirror_image').click(() => {
                    const wLeft = window.screenLeft ? window.screenLeft : window.screenX;
                    const wTop = window.screenTop ? window.screenTop : window.screenY;
                    const left = wLeft + (window.innerWidth / 2) - (800 / 2);
                    const top = wTop + (window.innerHeight / 2) - (500 / 2);
                    window.open(uprefix + corePrefix.admin + '/pages/browse', 'targetWindow',
                        `toolbar=no, location = no, status = no, menubar = no, scrollbars = yes, resizable = yes, width = 800, height = 500, top = ${top}, left = ${left}`
                    );
                });
            } 
            $('.zoiaAdd').click(() => {
                window.history.pushState({ action: 'create' }, document.title, uprefix + corePrefix.admin + '/pages?action=create');
                createItem();
            });
            $('#editForm_folder_btn').click(() => {
                foldersDialog.show();
                foldersModified = false;
                treeFindRoot(foldersTree);
            });
            $('#zoiaFoldersAdd').click(() => {
                $('#editFolderForm').zoiaFormBuilder().resetForm();
                folderEditDialog.show();
                foldersEditMode = false;
            });
            $('#zoiaFoldersEdit').click(() => {
                let sel = foldersTree.jstree(true).get_selected();
                if (!sel || !sel.length || foldersTree.jstree(true).get_parent(sel) === '#') {
                    return;
                }
                $('#editFolderForm').zoiaFormBuilder().resetForm();
                $('#editFolderForm_id').val(foldersTree.jstree(true).get_node(sel).text);
                for (let lng in langs) {
                    $('#editFolderForm_' + lng).val(foldersTree.jstree(true).get_node(sel).data.lang[lng] || '');
                }
                folderEditDialog.show();
                $('#editFolderForm_id').focus();
                foldersEditMode = true;
            });
            $('#zoiaFoldersDelete').click(() => {
                let sel = foldersTree.jstree(true).get_selected();
                if (!sel || !sel.length || foldersTree.jstree(true).get_parent(sel) === '#') {
                    return;
                }
                foldersTree.jstree(true).delete_node(sel);
                treeFindRoot(foldersTree);
                foldersModified = true;
            });
            $('#zoiaFoldersRevert').click(() => {
                foldersData = { id: 1, text: '/', data: null, parent: '#', type: 'root' };
                foldersModified = true;
                initFoldersTree();
            });
            $('#zoiaFoldersDialogButton').click(() => {
                let sel = foldersTree.jstree(true).get_selected();
                if (!sel || !sel.length) {
                    return;
                }
                foldersData = serializeFolders();
                let path = treePath(foldersData, sel[0]).reverse().join('/').replace('//', '') || '';
                if (path === '/') {
                    path = '';
                }
                if (foldersModified) {
                    foldersDialogSpinner(true);
                    $.ajax({
                        type: 'POST',
                        url: '/api/pages/folders',
                        data: { folders: foldersData },
                        cache: false
                    }).done((res) => {
                        foldersDialogSpinner(false);
                        if (res && res.status === 1) {
                            onSelectedFolder(sel, path);
                        } else {
                            $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        }
                    }).fail(() => {
                        foldersDialogSpinner(false);
                        $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    });
                } else {
                    onSelectedFolder(sel, path);
                }
            });
            $('#editForm_btnCancel').click(() => {
                window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/pages');
                $('#zoiaEdit').hide();
                $('#wrapTable').show();
            });
            $('#zoiaEditLanguages > li').click(function() {
                onZoiaEditLanguagesClick($(this).attr('data'));
            });
            $('#zoiaEditLanguageCheckbox').click(function() {
                onEditLanguageCheckboxClickEvent();
            });
            $('.pagesBtnRepair').click(() => {
                initRepairTree();
                repairDialog.show();
            });
            $('.pagesBtnRebuild').click(() => {
                ajaxRebuildDatabase();
            });
            $('.pagesBtnRefresh').click(() => {
                $('#pages').zoiaTable().load();
            });
            initEditor();
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();