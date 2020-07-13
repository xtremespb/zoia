/* eslint no-undef: 0 */
/* eslint max-len: 0 */

(() => {
    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/auth/${locale}.js`).done(() => {
            $('#zoiaReset').zoiaFormBuilder({
                save: {
                    url: '/api/auth/reset',
                    method: 'POST'
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
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
                },
                events: {
                    onInit: () => {},
                    onSaveSubmit: () => {},
                    onSaveValidate: () => {
                        $('#zoiaResetSpinner').show();
                        $('#zoiaReset_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                    },
                    onSaveSuccess: () => {
                        $('#zoiaReset').hide();
                        $('#requestSuccessful').show();
                        $('html, body').animate({
                            scrollTop: $('#zoiaReset').offset().top - 20
                        }, 'fast');
                    },
                    onSaveError: (res) => {
                        $('#zoiaResetSpinner').hide();
                        $('#zoiaReset_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                        res = res ? res : {};
                        switch (res.status) {
                            case -1:
                                $('#zoiaReset_email_error_text > span').html(lang.fieldErrors.email).show();
                                $('#zoiaReset_email_error_text').show();
                                break;
                            default:
                                $zUI.notification(lang['Error while setting new password'], {
                                    status: 'danger'
                                });
                                break;
                        }
                    }
                },
                items: {
                    email: {
                        autofocus: true,
                        type: 'email',
                        label: lang['E-mail'],
                        css: 'za-width-medium',
                        helpText: lang['Example: user@domain.com'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 6,
                                max: 129
                            },
                            regexp: /^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/,
                            process: (item) => {
                                return item.trim().toLowerCase();
                            }
                        }
                    },
                    captcha: {
                        type: 'captcha',
                        label: lang.Code,
                        helpText: lang['Digits you see on the picture'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 4,
                                max: 4
                            },
                            regexp: /^[0-9]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-margin-top',
                        buttons: [{
                            name: 'btnSave',
                            label: '<div za-spinner class="za-margin-right" id="zoiaResetSpinner" style="display:none"></div>' + lang.Reset,
                            css: 'za-button-primary',
                            type: 'submit'
                        }]
                    }
                }
            });
        });
    });
})();