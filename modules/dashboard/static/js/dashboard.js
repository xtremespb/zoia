/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let restartProgressDialog;

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        const langs = JSON.parse($('#zp_langs').attr('data'));
        const maintenanceEnabled = $('#zp_maintenanceEnabled').attr('data') === 'true' ? true : false;
        $.getScript(`/api/lang/dashboard/${locale}.js`).done(() => {
            restartProgressDialog = $zUI.modal('#zoiaRestartProgressDialog', {
                bgClose: false,
                escClose: false
            });
            $('#zoia_dashboard_restart').click(() => {
                $zUI.modal.confirm(lang['System will be restarted. Are you sure you wish to continue?'], { labels: { ok: lang['Yes'], cancel: lang['Cancel'] } }).then(function() {
                    $('#zoiaSpinnerMain').show();
                    $.ajax({
                        type: 'GET',
                        url: '/api/dashboard/restart',
                        cache: false
                    }).done((res) => {
                        $('#zoiaSpinnerMain').hide();
                        if (res && res.status === 1) {
                            restartProgressDialog.show();
                            setTimeout(() => {
                                location.href = '?_=' + Date.now();
                            }, 30000);
                        } else {
                            $zUI.notification(lang['Could not restart Zoia'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        }
                    }).fail(() => {
                        $('#zoiaSpinnerMain').hide();
                        $zUI.notification(lang['Could not restart Zoia'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }, 200);
                });
            });
            $('#zoia_settings').submit((e) => {
                e.preventDefault();
                let data = {
                    protocol: $('#zoia_settings_protocol').val(),
                    title: {},
                    titleShort: {},
                    url: {},
                    email: {
                        noreply: $('#zoia_settings_email_noreply').val().trim(),
                        feedback: $('#zoia_settings_email_feedback').val().trim()
                    }
                };
                for (let i in langs) {
                    data.title[langs[i]] = $('.zoia-settings-title[data="' + langs[i] + '"]').val().trim();
                    data.titleShort[langs[i]] = $('.zoia-settings-title-short[data="' + langs[i] + '"]').val().trim();
                    data.url[langs[i]] = $('.zoia-settings-url[data="' + langs[i] + '"]').val().trim();
                }
                $('#zoiaSpinnerMain').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/dashboard/settings/save',
                    data: {
                        config: data
                    },
                    cache: false
                }).done((res) => {
                    $('#zoiaSpinnerMain').hide();
                    if (res && res.status === 1) {
                        $zUI.notification(lang['Settings are saved'], {
                            status: 'success',
                            timeout: 1500
                        });
                    } else {
                        $zUI.notification(lang['Could not save settings'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    $('#zoiaSpinnerMain').hide();
                    $zUI.notification(lang['Could not save settings'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }, 200);
            });
            if (maintenanceEnabled) {
                $('#zoia_maintenance_on').click();
            }
            $('.zoia-maintenance').click(function() {
                if ($(this).hasClass('za-active')) {
                    return false;
                }
                $('#zoiaSpinnerMain').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/dashboard/settings/maintenance',
                    data: {
                        enabled: !$('#zoia_maintenance_on').hasClass('za-active')
                    },
                    cache: false
                }).done((res) => {
                    $('#zoiaSpinnerMain').hide();
                    if (res && res.status === 1) {
                        $zUI.notification(lang['Settings are saved'], {
                            status: 'success',
                            timeout: 1500
                        });
                    } else {
                        $zUI.notification(lang['Could not save settings'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    $('#zoiaSpinnerMain').hide();
                    $zUI.notification(lang['Could not save settings'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }, 200);
            });
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();