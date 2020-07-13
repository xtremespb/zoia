/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let zoiaReviewDialog;

    const captchaRefresh = () => {
        $('.rf-captcha-img').show();
        $('.rf-captcha-img').attr('src', '/api/captcha' + '?' + new Date().getTime());
        $('#rf_captcha').val('');
    };

    const submitForm = () => {
        $('.zoia-rfield').removeClass('za-form-danger');
        $('.zoia-review-error').hide();
        const name = $('#rf_name').val().trim();
        const text = $('#rf_text').val().trim();
        const captcha = $('#rf_captcha').val().trim();
        if (!name || !name.match(/^[^<>'\"/;`%]*$/) || name.length > 60) {
            $('.zoia-review-error-text').html(lang['Name is missing or contains invalid characters']);
            $('#rf_name').addClass('za-form-danger').focus();
            return $('.zoia-review-error').show();
        }
        if (!text || text.length > 2048) {
            $('.zoia-review-error-text').html(lang['Text is missing or is too long']);
            $('#rf_text').addClass('za-form-danger').focus();
            return $('.zoia-review-error').show();
        }
        if (!captcha || !captcha.match(/^[0-9]{4}$/)) {
            $('.zoia-review-error-text').html(lang['Invalid captcha']);
            $('#rf_captcha').addClass('za-form-danger').focus();
            return $('.zoia-review-error').show();
        }
        $('#zoiaReviewDialogSpinner').show();
        $('#zoiaReviewDialogWrap').hide();
        $.ajax({
            type: 'POST',
            url: '/api/reviews/add',
            cache: false,
            data: {
                name: name,
                text: text,
                captcha: captcha
            }
        }).done((res) => {
            $('#zoiaReviewDialogSpinner').hide();
            $('#zoiaReviewDialogWrap').show();
            if (res.status === 1) {
                zoiaReviewDialog.hide();
                $('#zoia_review_add').hide();
                $zUI.modal.alert(lang['Your review has been accepted for moderation.'], { labels: { ok: lang['OK'] } });
            } else {
                if (res.field) {
                    $('#rf_' + res.field).focus().addClass('za-form-danger');
                } else {
                    $('#rf_name').focus();
                }
                $zUI.notification(res.error || lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaReviewDialogSpinner').hide();
            $('#zoiaReviewDialogWrap').show();
            $('#rf_name').focus();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/reviews/${locale}.js`).done(() => {
            zoiaReviewDialog = $zUI.modal('#zoiaReviewDialog', {
                bgClose: false,
                escClose: false
            });
            $('#zoia_review_add').click(() => {
                $('.zoia-review-error').hide();
                $('.zoia-rfield').val('').removeClass('za-form-danger');
                zoiaReviewDialog.show().then(() => {
                    $('#rf_name').focus();
                });
            });
            $('#zoia_review_form').submit(function(e) {
                e.preventDefault();
                submitForm();
            });
            $('#zoia_btn_review_save').click(submitForm);
            captchaRefresh();
            $('.rf-captcha-img').click(() => {
                captchaRefresh();
            });
        });
    });
})();