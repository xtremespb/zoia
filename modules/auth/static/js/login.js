/* eslint no-undef: 0 */
/* eslint max-len: 0 */

(() => {
    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        const rxp = JSON.parse($('#zp_rxp').attr('data'));
        const redirectURL = $('#zp_redirectURL').attr('data');
        $.getScript(`/api/lang/auth/${locale}.js`).done(() => {
            $('#zoiaAuth').zoiaFormBuilder({
                save: {
                    url: '/api/auth/login',
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
                        $('#zoiaAuthSpinner').show();
                        $('#zoiaAuth').hide();
                        $('#zoiaAuth_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                    },
                    onSaveSuccess: () => {
                        $('html, body').animate({
                            scrollTop: $('#zoiaAuth').offset().top - 20
                        }, 'fast');
                        $('#zoiaAuthSpinner').show();
                        location.href = redirectURL;
                    },
                    onSaveError: (res) => {
                        $('#zoiaAuthSpinner').hide();
                        $('#zoiaAuth').show();
                        $('#zoiaAuth_btnSave').toggleClass('za-button-primary').toggleClass('za-button-default');
                        res = res ? res : {};
                        switch (res.status) {
                            case -1:
                                $('#zoiaAuth_username_error_text > span').html(lang['Invalid username or password']).show();
                                $('#zoiaAuth_username_error_text').show();
                                $('#zoiaAuth_username').addClass('za-form-danger').focus();
                                $('#zoiaAuth_password').addClass('za-form-danger');
                                break;
                            default:
                                $zUI.notification(lang['Error while authorizing'], {
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
                        css: 'za-width-1-1',
                        autofocus: true,
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
                    password: {
                        type: 'password',
                        css: 'za-width-1-1',
                        label: lang.Password,
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 5,
                                max: 50
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-margin-top za-text-center',
                        buttons: [{
                            name: 'btnSave',
                            label: '<div za-spinner class="za-margin-right" id="zoiaAuthSpinner" style="display:none"></div>' + lang['Log in'],
                            css: 'za-button-primary za-button-large',
                            type: 'submit'
                        }]
                    }
                }
            });
            $('.zoia-btn-oauth').click(function() {
                const url = $(this).attr('data-url');
                const wLeft = window.screenLeft ? window.screenLeft : window.screenX;
                const wTop = window.screenTop ? window.screenTop : window.screenY;
                const left = wLeft + (window.innerWidth / 2) - (800 / 2);
                const top = wTop + (window.innerHeight / 2) - (600 / 2);
                window.open(url, 'targetWindow', `toolbar=no, location = no, status = no, menubar = no, scrollbars = yes, resizable = yes, width = 800, height = 500, top = ${top}, left = ${left}`);
            });
            $('.zoia-page-loading').hide();
            $('#zoia_auth_wrap').show();
        });
    });
})();