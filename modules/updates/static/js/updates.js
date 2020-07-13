/* eslint max-len: 0 */
/* eslint no-undef: 0 */

(() => {
    let flagCheckUpdates = false;
    let updateDialog;
    let updateProgressDialog;
    let restartProgressDialog;

    let corePrefix;

    const btnCheckUpdatesHandler = () => {
        if (flagCheckUpdates) {
            return;
        }
        $('#spnCheckUpdates').show();
        flagCheckUpdates = true;
        $.ajax({
            type: 'GET',
            url: '/api/updates/check',
            cache: false
        }).done((res) => {
            $('#spnCheckUpdates').hide();
            flagCheckUpdates = false;
            if (res && res.status === 1) {
                if (res.update && res.update.version) {
                    $('#zoiaUpdateDialogVersion').html(res.update.version);
                    if (res.update.changelog) {
                        let html = '';
                        for (let i in res.update.changelog) {
                            html += '<li>' + res.update.changelog[i] + '</li>';
                        }
                        $('#zoiaUpdateDialogChangelog').html(html);
                    }
                    updateDialog.show();
                } else {
                    $zUI.notification(lang['Your system is up to date'], {
                        status: 'success',
                        timeout: 1500
                    });
                }
            } else {
                $zUI.notification(lang['Could not get version information from remote server'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#spnCheckUpdates').hide();
            flagCheckUpdates = false;
            $zUI.notification(lang['Could not get version information from remote server'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const updateRestart = () => {
        $.ajax({
            type: 'GET',
            url: '/api/updates/restart',
            cache: false
        });
    };

    const updateExtract = () => {
        $.ajax({
            type: 'GET',
            url: '/api/updates/extract',
            cache: false
        }).done((res) => {
            if (res && res.status === 1) {
                if (window.progressbar) {
                    progressbar.value = 100;
                }
                setTimeout(() => {
                    restartProgressDialog.show();
                    updateRestart();
                    setTimeout(() => {
                        restartProgressDialog.hide();
                        location.href = corePrefix.admin + '?rnd=' + Date.now();
                    }, 30000);
                }, 1000);
            } else {
                updateProgressDialog.hide();
                $zUI.notification(lang['Could not extract the update archive'] + (res.error ? ': ' + res.error : ''), {
                    status: 'danger',
                    timeout: 3000
                });
            }
        }).fail(() => {
            updateProgressDialog.hide();
            $zUI.notification(lang['Error while updating your system'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const updateDownload = () => {
        $.ajax({
            type: 'GET',
            url: '/api/updates/download',
            cache: false
        }).done((res) => {
            if (res && res.status === 1) {
                if (window.progressbar) {
                    progressbar.value = 50;
                }
            } else {
                updateProgressDialog.hide();
                $zUI.notification(lang['Could not download new version from remote server'] + (res.error ? ': ' + res.error : ''), {
                    status: 'danger',
                    timeout: 3000
                });
                return;
            }
            updateExtract();
        }).fail(() => {
            updateProgressDialog.hide();
            $zUI.notification(lang['Error while updating your system'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const btnUpdateStartHandler = () => {
        updateDialog.hide();
        if (window.progressbar) {
            progressbar.value = 10;
        }
        updateProgressDialog.show().then(() => {
            updateDownload();
        });
    };

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        const uprefix = $('#zp_uprefix').attr('data');
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        $.getScript(`/api/lang/updates/${locale}.js`).done(() => {
            $('#btnCheckUpdates').click(btnCheckUpdatesHandler);
            $('#btnUpdateStart').click(btnUpdateStartHandler);
            updateDialog = $zUI.modal('#zoiaUpdateDialog', {
                bgClose: false,
                escClose: false
            });
            updateProgressDialog = $zUI.modal('#zoiaUpdateProgressDialog', {
                bgClose: false,
                escClose: false
            });
            restartProgressDialog = $zUI.modal('#zoiaRestartProgressDialog', {
                bgClose: false,
                escClose: false
            });
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();