/* eslint no-undef: 0 */
/* eslint max-len: 0 */

(() => {
    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        const usernameConfirm = $('#zp_usernameConfirm').attr('data');
        const codeConfirm = $('#zp_codeConfirm').attr('data');
        $.getScript(`/api/lang/auth/${locale}.js`).done(() => {
            $('#zoiaResetConfirm').zoiaFormBuilder({
                save: {
                    url: '/api/auth/reset/confirm',
                    method: 'POST'
                },
                formDangerClass: 'za-form-danger',
                template: {
                    fields: '{fields}',
                    buttons: '{buttons}'
                },
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
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
                    onInit: () => {},
                    onSaveSubmit: () => {},
                    onSaveValidate: (data) => {
                        $('#zoiaResetConfirmSpinner').show();
                        $('#zoiaResetConfirm_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                        data.username = usernameConfirm;
                        data.code = codeConfirm;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('#zoiaResetConfirm').hide();
                        $('#resetConfirmSuccessful').show();
                        $('html, body').animate({
                            scrollTop: $('#zoiaResetConfirm').offset().top - 20
                        }, 'fast');
                    },
                    onSaveError: () => {
                        $('#zoiaResetConfirmSpinner').hide();
                        $('#zoiaResetConfirm_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                        $('#zoiaResetConfirm_password').focus();
                        $zUI.notification(lang['Error while setting new password'], {
                            status: 'danger'
                        });
                    }
                },
                items: {
                    password: {
                        autofocus: true,
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
                    buttons: {
                        type: 'buttons',
                        css: 'za-margin-top',
                        buttons: [{
                            name: 'btnSave',
                            label: '<div za-spinner class="za-margin-right" id="zoiaResetConfirmSpinner" style="display:none"></div>' + lang.Set,
                            css: 'za-button-primary',
                            type: 'submit'
                        }]
                    }
                }
            });
        });
    });
})();