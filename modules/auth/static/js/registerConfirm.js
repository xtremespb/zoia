/* eslint max-nested-callbacks: 0 */
/* eslint no-undef: 0 */

(() => {
    $(document).ready(() => {
        const usernameConfirm = $('#zp_usernameConfirm').attr('data');
        const codeConfirm = $('#zp_codeConfirm').attr('data');
        if (!usernameConfirm || !codeConfirm) {
            $('#confirmLoading').hide();
            $('#confirmFail').show();
            return;
        }
        $.ajax({
            type: 'POST',
            url: '/api/auth/register/confirm',
            data: {
                username: usernameConfirm,
                code: codeConfirm
            },
            cache: false
        }).done((res) => {
            setTimeout(() => {
                $('#confirmLoading').hide();
                if (res && res.status === 1) {
                    $('#confirmSuccess').show();
                } else {
                    $('#confirmFail').show();
                }
            }, 1000);
        }).fail(() => {
            // Fail
            setTimeout(() => {
                $('#confirmLoading').hide();
                $('#confirmFail').show();
            }, 1000);
        });
    });
})();