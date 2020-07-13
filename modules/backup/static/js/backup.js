/* eslint no-undef: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let dialogBackup;
    let dialogBackupOptions;
    let dialogRestore;

    const backupStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/backup/create/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    switch (res.state) {
                        case 0:
                            dialogBackup.hide();
                            $zUI.notification(lang['Could not create backup file. Please check logs for details.'], {
                                status: 'danger',
                                timeout: 1500
                            });
                            break;
                        default:
                            $('#dialogBackupWait').hide();
                            $('#dialogBackupDownload').show();
                            $('#dialogBackupButtons').show();
                            $('#dialogBackupDownloadLink').html('<a href="/backup/static/storage/backup_' + id + '.tgz">backup_' + id + '.tar.gz</a>');
                            break;
                    }
                } else {
                    setTimeout(() => {
                        backupStateCheck(id);
                    }, 5000);
                }
            } else {
                dialogBackup.hide();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            dialogBackup.hide();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const restoreStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/backup/restore/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    switch (res.state) {
                        case 0:
                            $('#dialogRestoreBody').show();
                            $('#dialogRestoreSpinner').hide();
                            $('#dialogRestoreFooter').show();
                            $zUI.notification(lang['Could not restore backup file. Please check logs for details.'], {
                                status: 'danger',
                                timeout: 1500
                            });
                            break;
                        default:
                            $('#dialogRestoreRestart').show();
                            $('#dialogRestoreSpinner').hide();
                            setTimeout(() => {
                                $('#dialogRestoreRestart').hide();
                                $('#dialogRestoreSuccess').show();
                            }, 30000);
                            break;
                    }
                } else {
                    setTimeout(() => {
                        restoreStateCheck(id);
                    }, 5000);
                }
            } else {
                dialogRestore.hide();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            dialogRestore.hide();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const backupStart = (modules) => {
        if ($('#zoia_btn_backup').hasClass('za-disabled')) {
            return;
        }
        $('#zoia_btn_backup').addClass('za-disabled');
        $('#zoiaSpinnerMain').show();
        $.ajax({
            type: 'POST',
            url: '/api/backup/create',
            cache: false,
            data: {
                modules: modules
            }
        }).done((res) => {
            $('#zoia_btn_backup').removeClass('za-disabled');
            $('#zoiaSpinnerMain').hide();
            if (res && res.status === 1 && res.taskId) {
                $('#dialogBackupWait').show();
                $('#dialogBackupDownload').hide();
                $('#dialogBackupButtons').hide();
                dialogBackup.show();
                setTimeout(() => {
                    backupStateCheck(res.taskId);
                }, 1500);
            } else {
                $('#zoia_btn_backup').removeClass('za-disabled');
                $('#zoiaSpinnerMain').hide();
                $zUI.notification(lang['Could not create backup file'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoia_btn_backup').removeClass('za-disabled');
            $('#zoiaSpinnerMain').hide();
            $zUI.notification(lang['Could not create backup file'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const initUploader = () => {
        const bimport_bar = document.getElementById('bimport_progressbar');
        bimport_bar.setAttribute('hidden', 'hidden');
        $zUI.upload('.bimport-upload', {
            url: '/api/backup/restore',
            multiple: false,
            error: function() {
                $zUI.notification(lang['Could not upload file'], {
                    status: 'danger',
                    timeout: 1500
                });
            },
            loadStart: function(e) {
                bimport_bar.removeAttribute('hidden');
                $('#dialogRestoreFooter').hide();
                bimport_bar.max = e.total;
                bimport_bar.value = e.loaded;
            },
            progress: function(e) {
                bimport_bar.max = e.total;
                bimport_bar.value = e.loaded;
            },
            loadEnd: function(e) {
                bimport_bar.max = e.total;
                bimport_bar.value = e.loaded;
            },
            completeAll: function() {
                setTimeout(function() {
                    bimport_bar.setAttribute('hidden', 'hidden');
                }, 1000);
                let response = {};
                try {
                    response = JSON.parse(arguments[0].response);
                } catch (e) {
                    // Ignore
                }
                if (response.taskId) {
                    $('#dialogRestoreBody').hide();
                    $('#dialogRestoreSpinner').show();
                    setTimeout(() => {
                        restoreStateCheck(response.taskId);
                    }, 1500);
                } else {
                    $('#dialogRestoreFooter').show();
                    $zUI.notification(lang['Could not upload file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    $(document).ready(() => {
        const locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/backup/${locale}.js`).done(() => {
            initUploader();
            $('#zoia_btn_backup').click(() => {
                $('.za-backup-module-checkbox').prop('checked', true);
                dialogBackupOptions.show();
            });
            $('#zoia_btn_backup_start').click(() => {
                let modules = [];
                $('.za-backup-module-checkbox').each(function() {
                    if ($(this).prop('checked')) {
                        modules.push($(this).attr('data'));
                    }
                });
                dialogBackupOptions.hide();
                backupStart(modules);
            });
            $('#zoia_btn_restore').click(() => {
                $('#dialogRestoreFooter').show();
                $('#dialogRestoreBody').show();
                $('#dialogRestoreSpinner').hide();
                dialogRestore.show();
            });
            dialogBackupOptions = $zUI.modal('#dialogBackupOptions', {
                bgClose: false,
                escClose: false
            });
            dialogBackup = $zUI.modal('#dialogBackup', {
                bgClose: false,
                escClose: false
            });
            dialogRestore = $zUI.modal('#dialogRestore', {
                bgClose: false,
                escClose: false
            });
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();