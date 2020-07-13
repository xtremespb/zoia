/* eslint max-len: 0 */
/* eslint no-undef: 0 */


(() => {
    let currentEditID;
    let currentEditAccountID;
    let userDialog;
    let accountDialog;
    let presetTitles = {};
    let pluginTitles = {};
    let hosts = {};

    let locale;
    let uprefix;
    let configModule;
    let plugins;
    let corePrefix;

    const editAccount = () => {
        $('#zoiaSpinnerWhite').show();
        $('#zoiaAccountForm').zoiaFormBuilder().loadData({ id: currentEditAccountID });
    };

    const bindAccountButtonHandlers = () => {
        $('.zoia-account-edit').unbind().click(function(e) {
            e.preventDefault();
            currentEditAccountID = $(this).attr('data');
            editAccount();
        });
        $('.zoia-account-delete').unbind().click(function(e) {
            e.preventDefault();
            const account = $(this).parent().parent().find('td:first').html();
            const accountID = $(this).attr('data');
            $zUI.modal.confirm(lang['Are you sure you wish to delete the account?'] + '&nbsp;(' + account + ')', { stack: true, labels: { ok: lang['OK'], cancel: lang['Cancel'] } }).then(function() {
                $('#zoiaSpinnerWhite').show();
                $.ajax({
                    type: 'GET',
                    url: '/api/hosting/account/delete',
                    cache: false,
                    data: {
                        id: accountID
                    }
                }).done((res) => {
                    $('#zoiaSpinnerWhite').hide();
                    if (res && res.status === 1) {
                        $('tr[data-account-id="' + accountID + '"]').remove();
                        $('#hosting').zoiaTable().load();
                        $zUI.notification(lang['Account has been deleted'], {
                            status: 'success',
                            timeout: 1500
                        });
                    } else {
                        $zUI.notification(lang['Error while loading data'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    $('#zoiaSpinnerWhite').hide();
                    $zUI.notification(lang['Error while loading data'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }, 200);
            });
        });
    };

    const editItem = (id) => {
        currentEditID = id;
        $('#zoiaUserDialogBody').hide();
        $('#zoiaUserDialogButtons').hide();
        $('#zoiaUserDialogHeader').hide();
        $('#zoiaUserDialogBodySpinner').show();
        $('#zoia_correction').removeClass('za-form-danger');
        userDialog.show().then(() => {
            $.ajax({
                type: 'GET',
                url: '/api/hosting/load',
                cache: false,
                data: {
                    id: id
                }
            }).done((res) => {
                if (res && res.status === 1) {
                    $('#zoiaUserDialogBody').show();
                    $('#zoiaUserDialogButtons').show();
                    $('#zoiaUserDialogBodySpinner').hide();
                    $('#zoiaUserDialogHeader').show();
                    $('.za-user-dialog-username').html(res.data.username);
                    $('.za-user-dialog-balance').html(res.data.balance || 0);
                    let balanceHistoryHTML = '<div class="zoia-balance-history-wrap">';
                    for (let i in res.data.transactions) {
                        balanceHistoryHTML += '<div za-grid class="za-grid-collapse"><div class="za-width-expand">' + new Date(parseInt(res.data.transactions[i].timestamp, 10) * 1000).toLocaleString() + '</div><div><span za-icon="' + (res.data.transactions[i].sum < 0 ? 'minus' : 'plus') + '-circle"></span>&nbsp;' + (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + Math.abs(res.data.transactions[i].sum) + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : '') + '</div></div>';
                    }
                    balanceHistoryHTML += '</div>';
                    $('.za-user-dialog-balance-history').html(balanceHistoryHTML);
                    let accountsHTML = '<div class="za-overflow-auto"><table class="za-table za-table-small za-table-divider za-table-striped za-table-middle za-table-responsive" id="zoia_accounts_table"><thead><tr><th>' + lang['Account'] + '</th><th>' + lang['Preset'] + '</th><th>' + lang['Plugin'] + '</th><th>' + lang['Days'] + '</th><th></th></tr></thead><tbody>';
                    for (let i in res.data.accounts) {
                        accountsHTML += '<tr data-account-id="' + res.data.accounts[i]._id + '"><td>' + res.data.accounts[i].id + '</td><td>' + (presetTitles[res.data.accounts[i].preset] || res.data.accounts[i].preset) + '</td><td>' + res.data.accounts[i].plugin + '</td><td>' + res.data.accounts[i].days + '</td><td style="width:95px"><a href="" class="za-icon-button za-margin-small-right zoia-account-edit" za-icon="pencil" data="' + res.data.accounts[i]._id + '"></a><a href="" class="za-icon-button za-margin-small-right zoia-account-delete" za-icon="trash" data="' + res.data.accounts[i]._id + '"></a><div style="width:1px;height:30px"></div></td></tr>';
                    }
                    accountsHTML += '</tbody></table></div>';
                    $('#zoiaUserAccounts').html(accountsHTML);
                    bindAccountButtonHandlers();
                    $zUI.tab('#za_catalog_user_tabs').show(0);
                } else {
                    userDialog.hide();
                    $zUI.notification(lang['Error while loading data'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                userDialog.hide();
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }, 200);
        });
    };

    const zoiaBtnCorrectionSaveClickHandler = () => {
        if ($('#zoia_spn_correction_save').is(':visible')) {
            return;
        }
        $('#zoia_correction').removeClass('za-form-danger');
        const sum = parseFloat($('#zoia_correction').val());
        if (!sum) {
            return $('#zoia_correction').focus().addClass('za-form-danger');
        }
        $('#zoia_spn_correction_save').show();
        $.ajax({
            type: 'GET',
            url: '/api/hosting/correction',
            cache: false,
            data: {
                id: currentEditID,
                sum: sum
            }
        }).done((res) => {
            $('#zoia_spn_correction_save').hide();
            if (res && res.status === 1) {
                $('.zoia-balance-history-wrap').prepend('<div za-grid class="za-grid-collapse"><div class="za-width-expand">' + new Date(parseInt(res.timestamp, 10) * 1000).toLocaleString() + '</div><div><span za-icon="' + (sum < 0 ? 'minus' : 'plus') + '-circle"></span>&nbsp;' + (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + Math.abs(sum) + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : '') + '</div></div>');
                $('#hosting').zoiaTable().load();
                $('#zoia_correction').val('');
                $('.za-user-dialog-balance').html(parseFloat($('.za-user-dialog-balance').html()) + sum);
            } else {
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoia_spn_correction_save').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const zoiaBtnAccountAddClickHandler = () => {
        currentEditAccountID = null;
        $('#zoiaAccountForm').zoiaFormBuilder().resetForm();
        accountDialog.show();
    };

    const init = () => {
        const formBuilderLang = {
            mandatoryMissing: lang['Should not be empty'],
            tooShort: lang['Too short'],
            tooLong: lang['Too long'],
            invalidFormat: lang['Doesn\'t match required format'],
            passwordsNotMatch: lang['Passwords do not match'],
            parameter: lang['Parameter'],
            value: lang['Value']
        };
        const formBuilderHTML = {
            helpText: '<div class="za-text-meta">{text}</div>',
            text: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
            select: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><select{multiple} class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
            passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
            captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-grid za-grid-small"><div><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="za-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}',
            buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
            button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
            launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}{html}</div>',
            textarea: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><textarea class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
            checkboxlistItem: '<li><label><input class="za-checkbox {prefix}-{name}-cbx" type="checkbox" data="{title}">&nbsp;&nbsp;{title}</label></li>',
            checkboxlist: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-panel za-panel-scrollable{css}" id="{prefix}_{name}_wrap"><ul class="za-list">{items}</ul></div>{helpText}</div>',
            valueslistItem: '<div class="za-flex za-margin-top {prefix}-{name}-item"><div class="za-margin-right"><input placeholder="{langParameter}" type="text" class="za-input formBuilder-valueslist-par" value="{key}"></div><div class="za-margin-right"><input placeholder="{langValue}" type="text" class="za-input formBuilder-valueslist-val" value="{value}"></div><div style="padding-top:3px"><button class="za-icon-button za-button-danger formBuilder-valueslist-btnDel" za-icon="icon:minus"></button></div></div>',
            valueslistItemFixed: '<div class="za-flex za-margin-top {prefix}-{name}-item"><div class="za-margin-right" style="margin-top:10px;min-width:100px;font-size:80%">{value}:</div><div class="za-margin-right"><input placeholder="{langValue}" type="text" class="za-input formBuilder-valueslist-val {prefix}-{name}-item-val" value="{data}" data="{key}"></div></div>',
            valueslistItemEditable: '<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body {prefix}-{name}-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">{key}</label><input placeholder="{langValue}" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="{value}" data="{data}"></div></div>',
            valueslistItemEditablePostfix: '<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body {prefix}-{name}-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">{key}</label><div><div class="za-inline za-form-width-medium"><span class="za-form-icon za-form-icon-flip">{postfix}</span><input placeholder="{langValue}" type="number" step="0.01" class="za-input za-width-1-1 formBuilder-valueslist-val" value="{value}" data-postfix="{postfix}" data="{data}"></div></div></div></div>',
            valueslist: '<div class="za-flex za-flex-column"><div class="za-margin-bottom"><label class="za-form-label">{label}:</label></div><div><button type="button" class="za-icon-button za-button-primary formBuilder-valueslist-btnAdd" id="{prefix}_{name}_btnAdd" za-icon="icon:plus" data-prefix="{prefix}" data-name="{name}"></button></div><div id="{prefix}_{name}_wrap" class="za-margin-bottom {prefix}-formBuilder-valueslist-wrap">{items}</div>',
            valueslistFixed: '<div class="za-flex za-flex-column"><div><label class="za-form-label">{label}:</label></div><div id="{prefix}_{name}_wrap" class="za-margin-bottom formBuilder-valueslist-wrap">{items}</div></div>',
            valueslistEditable: '<div class="za-flex za-flex-column" id="{prefix}_{name}_widget"><div class="za-margin-bottom"><label class="za-form-label">{label}:</label></div>{buttons}<div id="{prefix}_{name}_wrap" class="za-margin-bottom {prefix}-formBuilder-valueslist-wrap" za-sortable="handle:.za-sortable-handle">{items}</div><div class="za-margin-bottom">{helpText}</div></div>',
            bullet: '&nbsp;<span style="color:red;font-size:140%">&#8226;</span>'
        };
        const accountFormData = {
            template: {
                fields: '<div class="za-modal-body">{fields}</div>',
                buttons: '{buttons}'
            },
            formDangerClass: 'za-form-danger',
            html: formBuilderHTML,
            events: {
                onSaveValidate: (data) => {
                    $('#zoiaAccountDialogSpinner').show();
                    $('.zoiaAccountForm-form-button').hide();
                    data.id = currentEditID;
                    data._id = currentEditAccountID;
                    return data;
                },
                onSaveSuccess: (res) => {
                    $('#zoiaAccountDialogSpinner').hide();
                    $('.zoiaAccountForm-form-button').show();
                    $('#hosting').zoiaTable().load();
                    $zUI.notification(lang['Account has been saved'], {
                        status: 'success',
                        timeout: 1500
                    });
                    const data = '<td>' + res.account + '</td><td>' + res.preset + '</td><td>' + res.plugin + '</td><td>' + res.days + '</td><td style="width:95px"><a href="" class="za-icon-button za-margin-small-right zoia-account-edit" za-icon="pencil" data="' + res._id + '"></a><a href="" class="za-icon-button za-margin-small-right zoia-account-delete" za-icon="trash" data="' + res._id + '"></a></td>';
                    if ($('tr[data-account-id="' + res._id + '"]').length) {
                        $('tr[data-account-id="' + res._id + '"]').html(data);
                    } else {
                        $('#zoia_accounts_table>tbody').append('<tr data-account-id="' + res._id + '">' + data + '</tr>');
                    }
                    bindAccountButtonHandlers();
                    accountDialog.hide();
                },
                onSaveError: (res) => {
                    $('#zoiaAccountDialogSpinner').hide();
                    $('.zoiaAccountForm-form-button').show();
                    $zUI.notification(res.duplicate ? lang['Account already exists'] : lang['Error while adding the account'], {
                        status: 'danger',
                        timeout: 1500
                    });
                },
                onLoadSuccess: (data) => {
                    setTimeout(() => {
                        for (let i in data.item) {
                            $('#zoiaAccountForm_' + i).val(data.item[i]);
                        }
                        accountDialog.show().then(() => {
                            $('#zoiaSpinnerWhite').hide();
                            $('#zoiaAccountForm_account').focus();
                        });
                    }, 500);
                },
                onLoadError: () => {
                    setTimeout(() => {
                        $('#zoiaSpinnerWhite').hide();
                        $zUI.notification(lang['Error while loading data'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }, 500);
                }
            },
            save: {
                url: '/api/hosting/account/save',
                method: 'POST'
            },
            load: {
                url: '/api/hosting/account/load',
                method: 'GET'
            },
            items: {
                account: {
                    type: 'text',
                    label: lang['Account'],
                    css: 'za-width-medium',
                    autofocus: true,
                    validation: {
                        mandatoryCreate: true,
                        mandatoryEdit: true,
                        length: {
                            min: 1,
                            max: 64
                        },
                        regexp: /^[A-Za-z0-9_\-]+$/,
                        process: (item) => {
                            return item.trim();
                        }
                    },
                    helpText: lang['Latin characters and numbers only (1-64 chars)']
                },
                days: {
                    type: 'text',
                    label: lang['Days'],
                    css: 'za-width-small',
                    autofocus: true,
                    validation: {
                        mandatoryCreate: true,
                        mandatoryEdit: true,
                        length: {
                            min: 1,
                            max: 5
                        },
                        regexp: /^[0-9]+$/,
                        process: (item) => {
                            return item.trim();
                        }
                    }
                },
                preset: {
                    type: 'select',
                    label: lang['Preset'],
                    css: 'za-width-large',
                    autofocus: false,
                    values: presetTitles,
                    validation: {
                        mandatoryCreate: true
                    }
                },
                host: {
                    type: 'select',
                    label: lang['Host'],
                    css: 'za-width-large',
                    autofocus: false,
                    values: hosts,
                    validation: {
                        mandatoryCreate: true
                    }
                },
                plugin: {
                    type: 'select',
                    label: lang['Plugin'],
                    css: 'za-width-small',
                    autofocus: false,
                    values: pluginTitles,
                    validation: {
                        mandatoryCreate: true
                    }
                },
                buttons: {
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
                    html: '<div za-spinner style="float:right;display:none" id="zoiaAccountDialogSpinner"></div>'
                }
            },
            lang: formBuilderLang
        };
        for (let i in configModule.presets) {
            presetTitles[configModule.presets[i].id] = configModule.presets[i].titles[locale];
        }
        for (let i in configModule.hosts) {
            hosts[configModule.hosts[i]] = configModule.hosts[i];
        }
        for (let i in plugins) {
            pluginTitles[plugins[i]] = plugins[i];
        }
        $('#zoiaAccountForm').zoiaFormBuilder(accountFormData);
        userDialog = $zUI.modal('#zoiaUserDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        accountDialog = $zUI.modal('#zoiaAccountDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        $('#zoia_btn_correction_save').click(zoiaBtnCorrectionSaveClickHandler);
        $('#zoiaUserDialogCorrectionsForm').submit(function(e) {
            e.preventDefault();
            zoiaBtnCorrectionSaveClickHandler();
        });
        $('#zoia_btn_account_add').click(zoiaBtnAccountAddClickHandler);
        $('#hosting').zoiaTable({
            url: '/api/hosting/list',
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
                accounts: {
                    sortable: false,
                    process: (id, item, value) => {
                        return value || 0;
                    }
                },
                balance: {
                    sortable: false,
                    process: (id, item, value) => {
                        return (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + String(value || 0) + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : '');
                    }
                },
                actions: {
                    sortable: false,
                    process: (id, item) => {
                        return '<button class="za-icon-button zoia-hosting-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                            '" style="margin-right:5px"></button>&nbsp;';
                    }
                }
            },
            onLoad: () => {
                $('.zoia-hosting-action-edit-btn').click(function() {
                    window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/hosting?action=edit&id=' + $(this).attr('data'));
                    editItem($(this).attr('data'));
                });
                $('.zoia-hosting-action-del-btn').click(function() {
                    deleteItem($(this).attr('data'));
                });
            },
            lang: {
                error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                noitems: lang['No items to display']
            }
        });
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        uprefix = $('#zp_uprefix').attr('data');
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        configModule = JSON.parse($('#zp_configModule').attr('data'));
        plugins = JSON.parse($('#zp_plugins').attr('data'));
        $.getScript(`/api/lang/hosting/${locale}.js`).done(() => {
            init();
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();