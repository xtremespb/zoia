/* eslint no-undef: 0 */
/* eslint max-len: 0 */
/* eslint max-nested-callbacks: 0 */
(() => {
    let editDialog;
    let currentEditID;

    let corePrefix;
    let uprefix;
    let rxp;

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

    const showTable = () => {
        editDialog.hide();
        $('#brb').zoiaTable().load();
    };

    const editItem = (id) => {
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return showTable();
        }
        currentEditID = id;
        $('#editForm').zoiaFormBuilder().setEditMode(true);
        $('#editForm').zoiaFormBuilder().resetForm(false);
        editDialogSpinner(true);
        editFormSpinner(false);
        $('#editForm').zoiaFormBuilder().loadData({ id: id });
        editDialog.show();
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
            default:
                showTable();
                break;
        }
    };

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        uprefix = $('#zp_uprefix').attr('data');
        rxp = JSON.parse($('#zp_rxp').attr('data'));
        $.getScript(`/api/lang/brb/${locale}.js`).done(() => {
            editDialog = $zUI.modal('#zoiaEditDialog', {
                bgClose: false,
                escClose: false
            });
            $('#editForm').zoiaFormBuilder({
                save: {
                    url: '/api/brb/save',
                    method: 'POST'
                },
                load: {
                    url: '/api/brb/load',
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
                    select: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><select{multiple} class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-grid za-grid-small"><div><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="za-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}',
                    buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                    button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                    launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}</div>',
                    textarea: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><textarea class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    checkboxlistItem: '<li><label><input class="za-checkbox {prefix}-{name}-cbx" type="checkbox" data="{title}">&nbsp;&nbsp;{title}</label></li>',
                    checkboxlist: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-panel za-panel-scrollable{css}" id="{prefix}_{name}_wrap"><ul class="za-list">{items}</ul></div>{helpText}</div>'
                },
                events: {
                    onSaveValidate: (data) => {
                        editFormSpinner(true);
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('#editForm_groups_wrap').scrollTop(0);
                        editDialog.hide();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                        $('#brb').zoiaTable().load();
                        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/brb');
                    },
                    onSaveError: (res) => {
                        editFormSpinner(false);
                        if (res) {
                            switch (res.status) {
                                case -1:
                                    $zUI.notification(lang.fieldErrors['User not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    let ff = '';
                                    if (res.fields) {
                                        ff = '. ' + lang.fieldErrors['Fields failed'] + ': ' + res.fields.join(', ');
                                    }
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'] + ff, {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: () => {
                        editDialogSpinner(false);
                        $('#editForm_portfolioid').focus();
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
                    portfolioid: {
                        type: 'text',
                        label: lang['Portfolio ID'],
                        css: 'za-form-width-medium',
                        autofocus: true,
                        helpText: lang['Numbers only'],
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 10
                            },
                            regexp: /^[0-9]{1,10}$/,
                            process: (item) => {
                                return item.trim();
                            }
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
            $('#brb').zoiaTable({
                url: '/api/brb/list',
                limit: 20,
                sort: {
                    field: 'username',
                    direction: 'asc'
                },
                fields: {
                    username: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-brb-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-brb-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/brb?action=edit&id=' + $(this).attr('data'));
                        editItem($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            $('#editForm_btnCancel').click(() => {
                window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/brb');
                $('#editForm_groups_wrap').scrollTop(0);
            });
            $('.brbBtnRefresh').click(() => {
                $('#brb').zoiaTable().load();
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