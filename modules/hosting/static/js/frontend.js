/* eslint max-len: 0 */
/* eslint no-undef: 0 */

(() => {
    let accountExtendDialog;
    let accountCreateDialog;
    let accountProgressDialog;
    let accountExtendCost;
    let accountExtendID;

    let locale;
    let prices;
    let presets;
    let configModule;
    let totalFunds;
    let transactionsLength;

    const topupHandler = (e) => {
        e.preventDefault();
        if ($('#zoia_spinner_topup').is(':visible')) {
            return;
        }
        $('.zoia-topup-field').removeClass('za-form-danger');
        const sum = $('#topup_sum').val().trim();
        if (!sum || !sum.match(/^\d+(\.\d+)?$/)) {
            return $('#topup_sum').addClass('za-form-danger');
        }
        $('#zoia_spinner_topup').show();
        $('#zoia_btn_topup').hide();
        $.ajax({
            type: 'POST',
            url: '/customer/payment/request',
            data: {
                sum: sum
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.url) {
                location.href = res.url;
            } else {
                $('#zoia_spinner_topup').hide();
                $('#zoia_btn_topup').show();
                if (res.error) {
                    $zUI.modal.alert(res.error, { labels: { ok: lang['OK'] }, stack: true });
                } else {
                    $zUI.modal.alert(lang['Unable to create top-up request. Please try again later.'], { labels: { ok: lang['OK'] }, stack: true });
                }
            }
        }).fail(() => {
            $('#zoia_spinner_topup').hide();
            $('#zoia_btn_topup').show();
            $zUI.modal.alert(lang['Unable to create top-up request. Please try again later.'], { labels: { ok: lang['OK'] }, stack: true });
        }, 200);
    };

    const calculateCreateTotal = () => {
        const preset = $('#zoiaAccountForm_preset').val();
        const months = $('#zoiaAccountForm_months').val();
        const total = prices[preset] * months;
        if (total > totalFunds) {
            $('#zoiaAccountForm_btnSave').prop('disabled', true);
            $('#zoiaAccountCreateInsufficientFunds').show();
        } else {
            $('#zoiaAccountForm_btnSave').prop('disabled', false);
            $('#zoiaAccountCreateInsufficientFunds').hide();
        }
        $('.zoia-create-account-total').html((configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + total + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : ''));
    };

    const calculateExtendTotal = () => {
        const months = $('#zoiaAccountExtendForm_months').val();
        const total = accountExtendCost * months;
        if (total > totalFunds) {
            $('#zoiaAccountExtendForm_btnSave').prop('disabled', true);
            $('#zoiaAccountExtendInsufficientFunds').show();
        } else {
            $('#zoiaAccountExtendForm_btnSave').prop('disabled', false);
            $('#zoiaAccountExtendInsufficientFunds').hide();
        }
        $('.zoia-extend-account-total').html((configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + total + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : ''));
    };

    const btnExtendClickHandler = function(e) {
        e.preventDefault();
        accountExtendCost = parseFloat(prices[$(this).parent().parent().find('td:eq(1)').attr('data')]);
        accountExtendID = $(this).parent().parent().find('td:eq(0)').html();
        calculateExtendTotal();
        $('#zoiaAccountExtendForm').zoiaFormBuilder().resetForm();
        accountExtendDialog.show();
    };

    const checkAccountStatus = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/customer/account/create/status',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1) {
                if (res.state && res.state === 2) {
                    accountProgressDialog.hide();
                    if ($('.zoia-accounts-empty-accounts').is(':visible')) {
                        $('#zoia_account_table_body').html('');
                    }
                    if ($('.zoia-accounts-empty-history').is(':visible')) {
                        $('#zoia_history_table>tbody').html('');
                    }
                    $('#zoia_account_table_body').append('<tr><td class="zoia-accounts-id">' + res.id + '</td><td data="' + res.presetID + '">' + res.preset + '</td><td>' + res.days + '</td><td><a href="" class="za-icon-button zoia-btn-extend" za-icon="plus"></a></td></tr>');
                    $('#zoia_history_table>tbody').prepend('<tr><td>' + new Date(parseInt(res.timestamp, 10) * 1000).toLocaleString() + '</td><td><span za-icon="' + (res.sum < 0 ? 'minus' : 'plus') + '-circle"></span>&nbsp;' + (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + Math.abs(res.sum) + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : '') + '</td></tr>');
                    const total = parseFloat($('.zoia-balance').html()) - Math.abs(parseFloat(res.sum));
                    $('.zoia-balance').html(total);
                    totalFunds = total;
                    $('.zoia-btn-extend').unbind().click(btnExtendClickHandler);
                    $zUI.modal.alert(lang['Your account has been created successfully and is ready to use.'], { labels: { ok: lang['OK'] }, stack: true });
                } else {
                    setTimeout(() => {
                        checkAccountStatus(id);
                    }, 3000);
                }
            } else {
                accountProgressDialog.hide();
                $zUI.modal.alert(lang['Unable to create new account'], { labels: { ok: lang['OK'] }, stack: true });
            }
        }).fail(() => {
            accountProgressDialog.hide();
            $zUI.modal.alert(lang['Unable to create new account'], { labels: { ok: lang['OK'] }, stack: true });
        }, 200);
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        prices = JSON.parse($('#zp_prices').attr('data'));
        presets = JSON.parse($('#zp_presets').attr('data'));
        configModule = JSON.parse($('#zp_configModule').attr('data'));
        totalFunds = parseFloat($('#zp_totalFunds').attr('data'));
        transactionsLength = parseInt($('#zp_transactionsLength').attr('data'), 10);
        $.getScript(`/api/lang/hosting/${locale}.js`).done(() => {
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
            const accountCreateFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data) => {
                        const hasUpperCase = /[A-Z]/.test(data.password);
                        const hasLowerCase = /[a-z]/.test(data.password);
                        const hasNumbers = /\d/.test(data.password);
                        const hasNonalphas = /\W/.test(data.password);
                        if (hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas < 3) {
                            $zUI.modal.alert(lang['Password is too weak. Please use both lowercase and uppercase characters, numbers and special characters. Minimal length: 8'], { labels: { ok: lang['OK'] }, stack: true });
                            $('#zoiaAccountForm_password').addClass('za-form-danger');
                            $('#zoiaAccountForm_passwordConfirm').addClass('za-form-danger');
                            return '__stop';
                        }
                        $('#zoiaAccountCreateSpinner').show();
                        $('.zoiaAccountForm-form-button').hide();
                        return data;
                    },
                    onSaveSuccess: (res) => {
                        $('#zoiaAccountCreateSpinner').hide();
                        $('.zoiaAccountForm-form-button').show();
                        if (res && res.status && res.status === 1 && res.taskID) {
                            accountCreateDialog.hide();
                            accountProgressDialog.show();
                            checkAccountStatus(res.taskID);
                        } else {
                            $zUI.modal.alert(lang['Unable to create new account'], { labels: { ok: lang['OK'] }, stack: true });
                        }
                    },
                    onSaveError: (res) => {
                        $('#zoiaAccountCreateSpinner').hide();
                        $('.zoiaAccountForm-form-button').show();
                        if (res.error) {
                            $zUI.modal.alert(res.error, { labels: { ok: lang['OK'] }, stack: true });
                        } else {
                            $zUI.modal.alert(lang['Unable to create new account'], { labels: { ok: lang['OK'] }, stack: true });
                        }
                        for (let i in res.fields) {
                            $('#zoiaAccountForm_' + res.fields[i]).addClass('za-form-danger');
                        }
                        if (res.fields && res.fields.length) {
                            $('#zoiaAccountForm_' + res.fields[0]).focus();
                        }
                    }
                },
                save: {
                    url: '/api/customer/account/create',
                    method: 'POST'
                },
                items: {
                    id: {
                        type: 'text',
                        label: lang['Account&nbsp;ID'],
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
                    preset: {
                        type: 'select',
                        label: lang['Plan (price per month)'],
                        css: 'za-width-large',
                        autofocus: false,
                        values: presets,
                        validation: {
                            mandatoryCreate: true
                        }
                    },
                    password: {
                        type: 'passwordConfirm',
                        label: lang['Password'],
                        helpText: lang['Minimal length: 8 characters, type twice to verify. Required: uppercase and lowercase characters, numbers and special characters'],
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: false,
                            length: {
                                min: 8,
                                max: 50
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    months: {
                        type: 'select',
                        label: lang['Months'],
                        css: 'za-width-small',
                        autofocus: false,
                        values: {
                            1: '1',
                            2: '2',
                            3: '3',
                            4: '4',
                            5: '5',
                            6: '6',
                            7: '7',
                            8: '8',
                            9: '9',
                            10: '10',
                            11: '11',
                            12: '12'
                        },
                        validation: {
                            mandatoryCreate: true
                        }
                    },
                    calc: {
                        type: 'text',
                        label: ''
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Create'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="float:right;display:none" id="zoiaAccountCreateSpinner"></div>'
                    }
                },
                lang: formBuilderLang
            };
            const accountExtendFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data) => {
                        data.id = accountExtendID;
                        $('#zoiaAccountExtendSpinner').show();
                        $('.zoiaAccountExtendForm-form-button').hide();
                        return data;
                    },
                    onSaveSuccess: (res) => {
                        $('#zoiaAccountExtendSpinner').hide();
                        $('.zoiaAccountExtendForm-form-button').show();
                        if (res && res.status === 1) {
                            accountExtendDialog.hide();
                            $('.zoia-accounts-id').each(function() {
                                if ($(this).html() === accountExtendID) {
                                    $(this).parent().find('td:eq(2)').html(res.days);
                                }
                            });
                            $('#zoia_history_table>tbody').prepend('<tr><td>' + new Date(parseInt(res.timestamp, 10) * 1000).toLocaleString() + '</td><td><span za-icon="minus-circle"></span>&nbsp;' + (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + res.sum + (configModule.currencyPosition === 'right' ? '&nbsp;' + configModule.currency[locale] : '') + '</td></tr>');
                            const total = parseFloat($('.zoia-balance').html()) - Math.abs(parseFloat(res.sum));
                            $('.zoia-balance').html(total);
                            totalFunds = total;
                            $zUI.modal.alert(lang['Prolongation was successful'], { labels: { ok: lang['OK'] }, stack: true });
                        } else {
                            $zUI.modal.alert(lang['Unable to prolong account'], { labels: { ok: lang['OK'] }, stack: true });
                        }
                    },
                    onSaveError: (res) => {
                        $('#zoiaAccountExtendSpinner').hide();
                        $('.zoiaAccountExtendForm-form-button').show();
                        if (res.error) {
                            $zUI.modal.alert(res.error, { labels: { ok: lang['OK'] }, stack: true });
                        } else {
                            $zUI.modal.alert(lang['Unable to prolong account'], { labels: { ok: lang['OK'] }, stack: true });
                        }
                        for (let i in res.fields) {
                            $('#zoiaAccountExtendForm_' + res.fields[i]).addClass('za-form-danger');
                        }
                        if (res.fields && res.fields.length) {
                            $('#zoiaAccountExtendForm_' + res.fields[0]).focus();
                        }
                    }
                },
                save: {
                    url: '/api/customer/account/extend',
                    method: 'POST'
                },
                items: {
                    months: {
                        type: 'select',
                        label: lang['Months'],
                        css: 'za-width-small',
                        autofocus: false,
                        values: {
                            1: '1',
                            2: '2',
                            3: '3',
                            4: '4',
                            5: '5',
                            6: '6',
                            7: '7',
                            8: '8',
                            9: '9',
                            10: '10',
                            11: '11',
                            12: '12'
                        },
                        validation: {
                            mandatoryCreate: true
                        }
                    },
                    calc: {
                        type: 'text',
                        label: ''
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Prolong'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="float:right;display:none" id="zoiaAccountExtendSpinner"></div>'
                    }
                },
                lang: formBuilderLang
            };
            accountCreateDialog = $zUI.modal('#createAccountDialog', {
                bgClose: false,
                escClose: false
            });
            accountExtendDialog = $zUI.modal('#extendAccountDialog', {
                bgClose: false,
                escClose: false
            });
            accountProgressDialog = $zUI.modal('#accountProgressDialog', {
                bgClose: false,
                escClose: false
            });
            $('#zoia_btn_account_create').click(() => {
                $('#zoiaAccountForm').zoiaFormBuilder().resetForm();
                calculateCreateTotal();
                accountCreateDialog.show();
            });
            $('#zoiaAccountForm').zoiaFormBuilder(accountCreateFormData);
            $('#zoiaAccountExtendForm').zoiaFormBuilder(accountExtendFormData);
            $('#zoiaAccountForm_calc').parent().parent().html('<div class="za-alert-warning" za-alert id="zoiaAccountCreateInsufficientFunds" style="margin-bottom:-5px"><p>' + lang['Insufficient funds'] + '</p></div><div class="za-card za-card-default za-card-small za-card-body" style="padding-top:25px;"><p class="za-text-large">' + lang['Total'] + ':&nbsp;<span class="zoia-create-account-total"></span></div>');
            $('#zoiaAccountForm_preset').change(calculateCreateTotal).keypress(calculateCreateTotal);
            $('#zoiaAccountForm_months').change(calculateCreateTotal).keypress(calculateCreateTotal);
            $('#zoiaAccountExtendForm_months').change(calculateExtendTotal).keypress(calculateExtendTotal);
            $('#zoiaAccountExtendForm_calc').parent().parent().html('<div class="za-alert-warning" za-alert id="zoiaAccountExtendInsufficientFunds" style="margin-bottom:-5px;display:none"><p>' + lang['Insufficient funds'] + '</p></div><div class="za-card za-card-default za-card-small za-card-body" style="padding-top:25px;"><p class="za-text-large">' + lang['Total'] + ':&nbsp;<span class="zoia-extend-account-total"></span></div>');
            if (transactionsLength) {
                $('#zoia_history_table>tbody>tr').each(function() {
                    $(this).find('td:first').html(new Date(parseInt($(this).find('td:first').html(), 10) * 1000).toLocaleString());
                });
            }
            $('#zoia_history_table').show();
            $('.zoia-btn-extend').unbind().click(btnExtendClickHandler);
            $('#zoia_form_topup').submit(topupHandler);
            $('.zoia-loading').hide();
            $('.zoia-wrap-everything').show();
        });
    });
})();