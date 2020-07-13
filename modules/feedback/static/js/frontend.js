(() => {
    let locale;
    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/feedback/${locale}.js`).done(() => {
            $('#zoiaFeedback').zoiaFormBuilder({
                save: {
                    url: '/api/feedback/post',
                    method: 'POST'
                },
                formDangerClass: 'za-form-danger',
                template: {
                    fields: '{fields}',
                    buttons: '<div class="za-margin za-margin-large-top"><div class="za-form-controls">{buttons}</div></div>'
                },
                html: {
                    helpText: '<div class="za-text-meta">{text}</div>',
                    text: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    select: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><select class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}> <img class="{prefix}-captcha-img"><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div></div></div>{helpText}',
                    buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                    button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                    launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}</div>',
                    textarea: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><textarea rows="{rows}" class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>'
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
                        //$('#zoiaRegisterSpinner').show();
                        $('#zoiaSpinnerMain').show();
                    },
                    onSaveSuccess: () => {
                        $('#zoiaSpinnerMain').hide();
                        $('.zoia-feedback-wrap').hide();
                        $('.zoia-feedback-sent').show();
                    },
                    onSaveError: (res) => {
                        $('#zoiaSpinnerMain').hide();
                        $zUI.notification(lang['Could not send your message right now'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                items: {
                    name: {
                        type: 'text',
                        label: lang['Name'],
                        css: 'za-form-width-large',
                        autofocus: true,
                        helpText: lang['Your name or pseudonym'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    email: {
                        type: 'text',
                        label: lang['E-mail'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Your e-mail address'],
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/,
                            length: {
                                min: 6,
                                max: 129
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    phone: {
                        type: 'text',
                        label: lang['Phone'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Your phone number including country code'],
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^[0-9\+\-\s\(\)]+$/,
                            length: {
                                min: 3,
                                max: 64
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    message: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['Message'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Type a message you wish to send'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 1,
                                max: 4096
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    captcha: {
                        type: 'captcha',
                        label: lang.Code,
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
                        buttons: [{
                            name: 'btnSave',
                            label: lang['Send message'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }]
                    }
                }
            });
        });
    });
})();;