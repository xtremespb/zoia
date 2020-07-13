/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let editDialog;
    let deleteDialog;
    let currentEditID;
    let currentDeleteID;

    let uprefix;
    let corePrefix;

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

    const setZoiaEditHeader = (edit) => {
        if (edit) {
            $('#editDialogHeader').html(lang.editItem);
        } else {
            $('#editDialogHeader').html(lang.addItem);
        }
    };

    const editFormSpinner = (show) => {
        if (show) {
            $('.editForm-form-button').hide();
            $('#zoiaEditDialogSpinner').show();
        } else {
            $('.editForm-form-button').show();
            $('#zoiaEditDialogSpinner').hide();
        }
    };

    const editDialogSpinner = (show) => {
        if (show) {
            $('#zoiaEditDialogLoading').show();
            $('#zoiaEditDialogForm').hide();
        } else {
            $('#zoiaEditDialogLoading').hide();
            $('#zoiaEditDialogForm').show();
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

    const createItem = () => {
        $('#editForm').zoiaFormBuilder().setEditMode(false);
        $('#editForm').zoiaFormBuilder().resetForm(false);
        currentEditID = null;
        setZoiaEditHeader(false);
        editDialogSpinner(false);
        editFormSpinner(false);
        editDialog.show();
        $('#editGroup_groupname').focus();
    };

    const showTable = () => {
        editDialog.hide();
        $('#groups').zoiaTable().load();
    };

    const editItem = (id) => {
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return showTable();
        }
        currentEditID = id;
        setZoiaEditHeader(true);
        $('#editForm').zoiaFormBuilder().setEditMode(true);
        $('#editForm').zoiaFormBuilder().resetForm(false);
        editDialogSpinner(true);
        editFormSpinner(false);
        $('#editForm').zoiaFormBuilder().loadData({ id: id });
        editDialog.show();
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
                if ($('#groups').zoiaTable().getCurrentData()[id[i]].groupname === 'admin') {
                    $zUI.modal.alert(lang['Could not delete admin group because it\'s a system one.'], { labels: { ok: lang['OK'] } });
                    return;
                }
                names.push($('#groups').zoiaTable().getCurrentData()[id[i]].groupname);
            }
        } else {
            if (id === 'admin') {
                return;
            }
            items.push(id);
            currentDeleteID.push(id);
            names.push($('#groups').zoiaTable().getCurrentData()[id].groupname);
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
            url: '/api/groups/delete',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#groups').zoiaTable().load();
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
            $('#groups').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteDialogSpinner(false);
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

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        uprefix = $('#zp_uprefix').attr('data');
        $.getScript(`/api/lang/groups/${locale}.js`).done(() => {
            editDialog = $zUI.modal('#zoiaEditDialog', {
                bgClose: false,
                escClose: false
            });
            deleteDialog = $zUI.modal('#zoiaDeleteDialog', {
                bgClose: false,
                escClose: false
            });
            $('.zoiaDeleteButton').click(function() {
                const checked = $('.groupsCheckbox:checkbox:checked').map(function() {
                    return this.id;
                }).get();
                if (checked && checked.length > 0) {
                    deleteItem(checked);
                }
            });
            $('#zoiaDeleteDialogButton').click(() => {
                ajaxDeleteItem();
            });
            $('#editForm').zoiaFormBuilder({
                save: {
                    url: '/api/groups/save',
                    method: 'POST'
                },
                load: {
                    url: '/api/groups/load',
                    method: 'GET'
                },
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
                    onSaveValidate: (data) => {
                        editFormSpinner(true);
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        editDialog.hide();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                        $('#groups').zoiaTable().load();
                        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/groups');
                    },
                    onSaveError: (res) => {
                        editFormSpinner(false);
                        if (res && res.status) {
                            switch (res.status) {
                                case -1:
                                    $zUI.notification(lang.fieldErrors['Group not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $zUI.notification(lang.fieldErrors['Group already exists in database'], {
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
                    onLoadSuccess: () => {
                        editDialogSpinner(false);
                        $('#editForm_groupname').focus();
                    },
                    onLoadError: () => {
                        editDialog.hide();
                        $('#zoiaEditDialog').hide();
                        $zUI.notification(lang['Could not load information from database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                items: {
                    groupname: {
                        type: 'text',
                        label: lang['Name'],
                        css: 'za-form-width-medium',
                        autofocus: true,
                        helpText: lang['Latin characters and numbers, length: 3-20'],
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 3,
                                max: 20
                            },
                            regexp: /^[A-Za-z0-9_\-]+$/,
                            process: (item) => {
                                return item.trim().toLowerCase();
                            }
                        }
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
                            regexp: /^(0|1)$/
                        }
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            name: 'btnCancel',
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="float:right;display:none" id="zoiaEditDialogSpinner"></div>'
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
            $('#groups').zoiaTable({
                url: '/api/groups/list',
                limit: 20,
                sort: {
                    field: 'groupname',
                    direction: 'asc'
                },
                fields: {
                    groupname: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    email: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
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
                            if (item && item.groupname === 'admin') {
                                return '&ndash;';
                            }
                            return '<button class="za-icon-button zoia-groups-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-groups-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-groups-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/groups?action=edit&id=' + $(this).attr('data'));
                        editItem($(this).attr('data'));
                    });
                    $('.zoia-groups-action-del-btn').click(function() {
                        deleteItem($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            $('#editForm_btnCancel').click(() => {
                window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/groups');
            });
            $('.groupsBtnRefresh').click(() => {
                $('#groups').zoiaTable().load();
            });
            $('.zoiaAdd').click(() => {
                window.history.pushState({ action: 'create' }, document.title, uprefix + corePrefix.admin + '/groups?action=create');
                createItem();
            });
            $(window).bind('popstate',
                (event) => {
                    processState(event.originalEvent.state);
                });
            processState();
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();