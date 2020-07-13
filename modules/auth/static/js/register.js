/* eslint no-undef: 0 */
/* eslint max-len: 0 */

(() => {
    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        const rxp = JSON.parse($('#zp_rxp').attr('data'));
        $.getScript(`/api/lang/auth/${locale}.js`).done(() => {
            $('#zoiaRegister').zoiaFormBuilder({
                save: {
                    url: '/api/auth/register',
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
                        $('#zoiaRegisterSpinner').show();
                        $('#zoiaRegister_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                    },
                    onSaveSuccess: () => {
                        $('#zoiaRegister').hide();
                        $('#registrationSuccessful').show();
                        $('html, body').animate({
                            scrollTop: $('#zoiaRegister').offset().top - 20
                        }, 'fast');
                    },
                    onSaveError: (res) => {
                        $('#zoiaRegisterSpinner').hide();
                        $('#zoiaRegister_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                        res = res ? res : {};
                        switch (res.status) {
                            case -1:
                                $('#zoiaRegister_username_error_text > span').html(lang.fieldErrors.usernameTaken).show();
                                $('#zoiaRegister_username_error_text').show();
                                break;
                            case -2:
                                $('#zoiaRegister_email_error_text > span').html(lang.fieldErrors.emailTaken).show();
                                $('#zoiaRegister_email_error_text').show();
                                break;
                            case -3:
                                $('#zoiaRegister_captcha_error_text > span').html(lang.fieldErrors.captcha).show();
                                $('#zoiaRegister_captcha_error_text').show();
                                break;
                            default:
                                $zUI.notification(lang['Error while registering new account'], {
                                    status: 'danger'
                                });
                                break;
                        }
                    }
                },
                items: {
                    username: {
                        type: 'text',
                        label: lang.Username,
                        css: 'za-form-width-medium',
                        autofocus: true,
                        helpText: lang['Latin characters and numbers, length: 3-20'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 3,
                                max: 20
                            },
                            regexp: rxp.username,
                            process: (item) => {
                                return item.trim().toLowerCase();
                            }
                        }
                    },
                    email: {
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
                    password: {
                        type: 'passwordConfirm',
                        label: lang.Password,
                        helpText: lang['Minimal length: 8 characters, type twice to verify'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 8,
                                max: 50
                            },
                            process: (item) => {
                                return item.trim();
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
                            label: '<div za-spinner class="za-margin-right" id="zoiaRegisterSpinner" style="display:none"></div>' + lang.Register,
                            css: 'za-button-primary',
                            type: 'submit'
                        }]
                    }
                }
            });
        });
    });
})();