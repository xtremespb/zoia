/* eslint max-len: 0 */
/* eslint no-undef: 0 */

(() => {
    let currentSupportRequestID;
    let supportMessageDialog;
    let locale;
    let uprefix;
    let aprefix;

    const initUploader = () => {
        $zUI.upload('.js-upload', {
            url: '/api/users/picture/upload',
            multiple: false,
            beforeSend: function(environment) {
                $('#zoia_actc_photo_progress').show();
                $('#zoia_actc_photo_progress>span').html('');
                $('.zoia-btn-picture').hide();
            },
            error: function() {
                $('#zoia_actc_photo_progress').hide();
                $('.zoia-btn-picture').show();
            },
            progress: function(e) {
                let prc = parseInt(100 / e.total * e.loaded, 10);
                if (prc === 100) {
                    prc = 99;
                }
                $('#zoia_actc_photo_progress>span').html(`${prc}%`);
            },
            completeAll: function(data) {
                $('.zoia-btn-picture').show();
                $('#zoia_actc_photo_progress>span').html('100%');
                setTimeout(() => {
                    $('#zoia_actc_photo_progress').hide();
                }, 500)
                let res = {};
                try {
                    res = JSON.parse(data.response);
                } catch (e) {
                    // Ignore
                }
                if (res.status && res.status === 1) {
                    $('#zoia_actc_picture').attr('src', res.pictureURL + '?_' + Date.now());
                } else {
                    $zUI.notification(lang['Could not upload image to server'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    const pictureResetClickHandler = () => {
        $zUI.modal.confirm(lang['Your profile picture will be deleted permanently. Continue?'], { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(function() {
            $('#zoia_actc_photo_progress>span').html('');
            $('#zoia_actc_photo_progress').show();
            $('.zoia-btn-picture').hide();
            $.ajax({
                type: 'POST',
                url: '/api/users/picture/delete',
                cache: false
            }).done((res) => {
                $('.zoia-btn-picture').show();
                $('#zoia_actc_photo_progress').hide();
                if (res && res.status === 1) {
                    $('#zoia_actc_picture').attr('src', res.pictureURL + '?_' + Date.now());
                } else {
                    $zUI.notification(lang['Could not delete image on server'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                $('.zoia-btn-picture').show();
                $('#zoia_actc_photo_progress').hide();
                $zUI.notification(lang['Could not delete image on server'], {
                    status: 'danger',
                    timeout: 1500
                });
            }, 200);
        });
    };

    const commonFormSubmitHandler = (e) => {
        e.preventDefault();
        if ($('#spnCommonForm').is(':visible')) {
            return;
        }
        const realname = $('#zoia_actc_realname').val().trim();
        $('#spnCommonForm').show();
        $('#zoia_actc_realname').removeClass('za-form-danger');
        $.ajax({
            type: 'POST',
            url: '/api/users/profile/common/save',
            data: {
                realname: realname
            },
            cache: false
        }).done((res) => {
            $('#spnCommonForm').hide();
            if (res && res.status === 1) {
                $zUI.notification(lang['Profile information has been saved'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                if (res.status === 2) {
                    $('#zoia_actc_realname').addClass('za-form-danger').focus();
                }
                $zUI.notification(lang['Could not save profile information'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#spnCommonForm').hide();
            $zUI.notification(lang['Could not save profile information'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const passwordFormSubmitHandler = (e) => {
        e.preventDefault();
        if ($('#spnPasswordForm').is(':visible')) {
            return;
        }
        $('.zoia-act-form-field').removeClass('za-form-danger');
        $('.zoia-form-error-message').hide();
        const passwordCurrent = $('#zoia_act_password_current').val().trim();
        const password = $('#zoia_act_password').val().trim();
        const passwordConfirm = $('#zoia_act_password_confirm').val().trim();
        if (!passwordCurrent.length || passwordCurrent.length > 50) {
            $('#zoia_act_password_current_error>span').html(lang['Doesn\'t match required format']);
            $('#zoia_act_password_current_error').show();
            return $('#zoia_act_password_current').focus().addClass('za-form-danger');
        }
        if (password !== passwordConfirm) {
            $('#zoia_act_password_error>span').html(lang['Passwords do not match']);
            $('#zoia_act_password_error').show();
            $('#zoia_act_password_confirm').addClass('za-form-danger');
            return $('#zoia_act_password').addClass('za-form-danger').focus();
        }
        if (!password.length || password.length < 8 || password.length > 50) {
            $('#zoia_act_password_error>span').html(lang['Doesn\'t match required format']);
            $('#zoia_act_password_error').show();
            $('#zoia_act_password_confirm').addClass('za-form-danger');
            return $('#zoia_act_password').focus().addClass('za-form-danger');
        }
        $('#spnPasswordForm').show();
        $.ajax({
            type: 'POST',
            url: '/api/users/profile/password/save',
            data: {
                passwordCurrent: passwordCurrent,
                passwordNew: password
            },
            cache: false
        }).done((res) => {
            $('#spnPasswordForm').hide();
            if (res && res.status === 1) {
                $zUI.modal.alert(lang['Your password has been changed. Now you will be forwarded to the sign in form.'], { labels: { ok: lang['OK'], cancel: lang['Cancel'] }, stack: true }).then(function() {
                    $('.zoia-loading').show();
                    $('.zoia-wrap').hide();
                    window.location.href = uprefix + aprefix + '?redirect=' + uprefix + '/account?_=' + Date.now();
                });
            } else {
                $zUI.notification(lang['Could not save profile information'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#spnPasswordForm').hide();
            $zUI.notification(lang['Could not save profile information'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const email1FormSubmitHandler = (e) => {
        e.preventDefault();
        if ($('#spnEmail1Form').is(':visible')) {
            return;
        }
        $('.zoia-act-form-field').removeClass('za-form-danger');
        $('.zoia-form-error-message').hide();
        const emailNew = $('#zoia_act_email_new').val().trim();
        if (!emailNew.length || emailNew.length > 129 || emailNew.length < 6 ||
            !emailNew.match(/^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/)) {
            $('#zoia_act_email_new_error>span').html(lang['Doesn\'t match required format']);
            $('#zoia_act_email_new_error').show();
            return $('#zoia_act_email_new').focus().addClass('za-form-danger');
        }
        $('#spnEmail1Form').show();
        $.ajax({
            type: 'POST',
            url: '/api/users/profile/email/step1',
            data: {
                emailNew: emailNew
            },
            cache: false
        }).done((res) => {
            $('#spnEmail1Form').hide();
            if (res && res.status === 1) {
                $('#zoia_act_email_code2_label').html(emailNew);
                $('#zoia_act_email_step1').hide();
                $('#zoia_act_email_step2').show();
                $('#zoia_act_email_code1').focus();
            } else {
                $zUI.notification(lang['Could not send confirmation codes'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#spnEmail1Form').hide();
            $zUI.notification(lang['Could not send confirmation codes'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const email2FormSubmitHandler = (e) => {
        e.preventDefault();
        if ($('#spnEmail2Form').is(':visible')) {
            return;
        }
        $('.zoia-act-form-field').removeClass('za-form-danger');
        $('.zoia-form-error-message').hide();
        const code1 = $('#zoia_act_email_code1').val().trim();
        const code2 = $('#zoia_act_email_code2').val().trim();
        if (!code1 || !code1.match(/^[0-9]{1,6}$/)) {
            $('#zoia_act_email_code1_error>span').html(lang['Doesn\'t match required format']);
            $('#zoia_act_email_code1_error').show();
            return $('#zoia_act_email_code1').focus().addClass('za-form-danger');
        }
        if (!code2 || !code2.match(/^[0-9]{1,6}$/)) {
            $('#zoia_act_email_code2_error>span').html(lang['Doesn\'t match required format']);
            $('#zoia_act_email_code2_error').show();
            return $('#zoia_act_email_code2').focus().addClass('za-form-danger');
        }
        $('#spnEmail2Form').show();
        $.ajax({
            type: 'POST',
            url: '/api/users/profile/email/step2',
            data: {
                code1: code1,
                code2: code2
            },
            cache: false
        }).done((res) => {
            $('#spnEmail2Form').hide();
            if (res && res.status === 1) {
                $zUI.modal.alert(lang['Your e-mail address has been changed. Now you will be forwarded to the sign in form.'], { labels: { ok: lang['OK'], cancel: lang['Cancel'] }, stack: true }).then(function() {
                    $('.zoia-loading').show();
                    $('.zoia-wrap').hide();
                    window.location.href = uprefix + aprefix + '?redirect=' + uprefix + '/account?_=' + Date.now();
                });
            } else {
                if (res.status === -4) {
                    $zUI.notification(lang['Invalid codes. Please check your input and try again.'], {
                        status: 'danger',
                        timeout: 1500
                    });
                    $('#zoia_act_email_code2').addClass('za-form-danger');
                    $('#zoia_act_email_code1').focus().addClass('za-form-danger');
                }
                if (res.status === -3) {
                    $zUI.notification(lang['Invalid code(s). Please check your input and try again.'], {
                        status: 'danger',
                        timeout: 1500
                    });
                    $('#zoia_act_email_code2').addClass('za-form-danger');
                    return $('#zoia_act_email_code1').focus().addClass('za-form-danger');
                } else if (res.status === -4) {
                    return $zUI.modal.alert(lang['Too many accepts. Now you will be forwarded to the sign in form.'], { labels: { ok: lang['OK'], cancel: lang['Cancel'] }, stack: true }).then(function() {
                        $('.zoia-loading').show();
                        $('.zoia-wrap').hide();
                        window.location.href = uprefix + aprefix + '?redirect=' + uprefix + '/account?_=' + Date.now();
                    });
                } else {
                    $zUI.notification(lang['Could not change e-mail address'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        }).fail(() => {
            $('#spnEmail2Form').hide();
            $zUI.notification(lang['Could not change e-mail address'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        uprefix = $('#zp_uprefix').attr('data');
        aprefix = $('#zp_aprefix').attr('data');
        $.getScript(`/api/lang/users/${locale}.js`).done(() => {
            $('.zoia-account-timestamp').html($('.zoia-account-timestamp').html().length ? new Date(parseInt($('.zoia-account-timestamp').html(), 10) * 1000).toLocaleString() : lang['unknown']);
            $('.zoia-account-status').html(lang.statuses[parseInt($('.zoia-account-status').html(), 10)]);
            initUploader();
            $('#zoia_actc_btn_picture_reset').click(pictureResetClickHandler);
            $('#zoia_act_form_common').submit(commonFormSubmitHandler);
            $('#zoia_act_form_password').submit(passwordFormSubmitHandler);
            $('#zoia_act_form_email1').submit(email1FormSubmitHandler);
            $('#zoia_act_form_email2').submit(email2FormSubmitHandler);
            // Finally
            $('.zoia-loading').hide();
            $('.zoia-wrap').show();
        });
    });
})();