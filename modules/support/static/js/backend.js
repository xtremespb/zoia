/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint max-nested-callbacks: 0 */
/* eslint no-nested-ternary: 0 */

(() => {
    let supportDialog;
    let supportMessageDialog;
    let currentSupportRequestID;
    let currentSupportMessageID;
    let currentData;
    let currentUsername;

    const deleteAttachment = (id, fid) => {
        $('#zoiaSpinnerWhite').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/request/attachment/delete',
            cache: false,
            data: {
                id: id,
                fid: fid
            }
        }).done((res) => {
            setTimeout(() => {
                $('#zoiaSpinnerWhite').hide();
            }, 300);
            if (res && res.status === 1) {
                $('.zoia-attachment-delete[data-fid="' + fid + '"]').parent().remove();
            } else {
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            setTimeout(() => {
                $('#zoiaSpinnerWhite').hide();
            }, 300);
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const bindMessageHandlers = () => {
        $('.zoia-msg-edit').unbind().click(function() {
            currentSupportMessageID = $(this).attr('data');
            $('#zoia_support_msg').removeClass('za-form-danger').val('');
            supportMessageDialog.show().then(() => {
                $('#zoia_support_msg').val($('.zoia-msg-text[data="' + currentSupportMessageID + '"]').html().replace(/&lt;/, '<').replace(/&gt;/, '>').replace(/&quot;/, '"').replace(/&amp;/, '&'));
                $('#zoia_support_msg').focus();
            });
        });
        $('.zoia-msg-delete').unbind().click(function() {
            currentSupportMessageID = $(this).attr('data');
            $zUI.modal.confirm(lang['Message will be removed from support ticket. Continue?'], { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(function() {
                $('#zoiaSpinnerDark').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/support/request/message/delete',
                    cache: false,
                    data: {
                        id: currentSupportRequestID,
                        msgId: currentSupportMessageID
                    }
                }).done((res) => {
                    $('#zoiaSpinnerDark').hide();
                    if (res && res.status === 1) {
                        $('.zoia-msg-text[data="' + currentSupportMessageID + '"]').parent().parent().remove();
                    } else {
                        $zUI.notification(lang['Error while loading data'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                }).fail(() => {
                    $('#zoiaSpinnerDark').hide();
                    $zUI.notification(lang['Error while loading data'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }, 200);
            });
        });
    };

    const ajaxPickUp = (pickup, mute, reloadTable) => {
        $('#zoiaSpinnerWhite').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/request/pickup',
            cache: false,
            data: {
                id: currentSupportRequestID,
                pickup: pickup ? true : null
            }
        }).done((res) => {
            $('#zoiaSpinnerWhite').hide();
            if (res && res.status === 1) {
                $('#zoia_support_specialist').html(res.specialist);
                if (!mute) {
                    $zUI.notification(lang['Data has been saved successfully'], {
                        status: 'success',
                        timeout: 1500
                    });
                }
                if (reloadTable) {
                    $('#support').zoiaTable().load();
                }
            } else {
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaSpinnerWhite').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const bindDeleteAttachmentHandlers = () => {
        $('.zoia-attachment-delete').unbind().click(function() {
            const filename = $(this).parent().find('a').html();
            const id = $(this).attr('data-id');
            const fid = $(this).attr('data-fid');
            $zUI.modal.confirm(lang['The following file will be deleted. Continue?'] + '<br><br>' + filename, { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(() => {
                deleteAttachment(id, fid);
            });
        });
    };

    const loadSupportRequest = () => {
        $.ajax({
            type: 'GET',
            url: '/api/support/request/load',
            cache: false,
            data: {
                id: currentSupportRequestID
            }
        }).done((res) => {
            if (res && res.status === 1 && res.data) {
                currentData = res.data;
                $('#zoia_support_timestamp').html(new Date(parseInt(res.data.timestamp, 10) * 1000).toLocaleString());
                $('#zoia_support_username').html(res.data.username);
                $('#zoia_support_specialist').html(res.data.specialist);
                $('#zoia_support_status').val(res.data.status);
                $('#zoia_support_priority').val(res.data.priority);
                $('#zoia_support_title').val(res.data.title);
                if (res.data.messages) {
                    res.data.messages.sort(function(a, b) {
                        return (a.timestamp > b.timestamp) ? -1 : ((b.timestamp > a.timestamp) ? 1 : 0);
                    });
                }
                let supportMessagesHTML = '';
                for (let i in res.data.messages) {
                    let cc = '';
                    if (res.data.messages[i].username !== currentUsername) {
                        cc = ' zoia-reply-msg';
                    }
                    supportMessagesHTML += '<article class="za-comment za-margin za-card za-card-default za-card-small za-card-body' + cc + '"><header class="za-comment-header za-grid-medium za-flex-middle" za-grid><div class="za-width-expand""><h4 class="za-comment-title za-margin-remove"><span class="za-link-reset">' + res.data.messages[i].username + '</span></h4><ul class="za-comment-meta za-subnav za-subnav-divider za-margin-remove-top" style="border-bottom:1px solid #ddd"><li><span>' + new Date(parseInt(res.data.messages[i].timestamp, 10) * 1000).toLocaleString() + '</span></li><li><span class="zoia-msg-edit" data="' + res.data.messages[i].id + '">' + lang['Edit'] + '</span></li><li><span class="zoia-msg-delete" data="' + res.data.messages[i].id + '">' + lang['Delete'] + '</span></li></ul></div></header><div class="za-comment-body"><p class="zoia-msg-text" data="' + res.data.messages[i].id + '">' + res.data.messages[i].message.replace(/\n/gm, '<br>') + '</p></div></article>';
                }
                $('#zoia_support_messages').html(supportMessagesHTML);
                let filesHTML = '';
                for (let i in res.data.files) {
                    const file = res.data.files[i];
                    filesHTML += '<div><span za-icon="icon:trash" class="zoia-attachment-delete" data-id="' + res.data._id + '" data-fid="' + file.id + '"></span>&nbsp;<a href="/api/support/download?id=' + res.data._id + '&fid=' + file.id + '" target="_blank">' + file.filename + '</a></div>';
                }
                $('#zoia_attachments').html(filesHTML);
                bindMessageHandlers();
                bindDeleteAttachmentHandlers();
                $('#support_request_id').html(currentSupportRequestID);
                if (res.data.specialist && res.data.specialist !== currentUsername) {
                    setTimeout(() => {
                        $('#zoiaSpinnerDark').hide();
                    }, 200);
                    $zUI.modal.confirm(lang['Selected support request is currently being processed by another specialist. Continue?'] + '<br><br>' + res.data.specialist, { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(function() {
                        supportDialog.show().then(() => {
                            $zUI.tab('#zoia_support_dialog_tabs').show(0);
                        });
                    });
                } else {
                    supportDialog.show().then(() => {
                        $zUI.tab('#zoia_support_dialog_tabs').show(0);
                        $('#zoiaSpinnerDark').hide();
                    });
                }
            } else {
                $('#zoiaSpinnerDark').hide();
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaSpinnerDark').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const btnMessageSaveClickHandler = () => {
        $('#zoia_support_msg').removeClass('za-form-danger');
        const msg = $('#zoia_support_msg').val().trim();
        if (!msg || msg.length > 4096) {
            return $('#zoia_support_msg').addClass('za-form-danger');
        }
        $('#zoiaSpinnerDark').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/request/message/edit',
            cache: false,
            data: {
                id: currentSupportRequestID,
                msgId: currentSupportMessageID,
                msg: msg
            }
        }).done((res) => {
            $('#zoiaSpinnerDark').hide();
            if (res && res.status === 1) {
                if (currentSupportMessageID) {
                    $('.zoia-msg-text[data="' + currentSupportMessageID + '"]').html(res.message.message.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\"/g, '&quot;'));
                } else {
                    const supportMessagesHTML = '<article class="za-comment za-margin za-card za-card-default za-card-small za-card-body"><header class="za-comment-header za-grid-medium za-flex-middle" za-grid><div class="za-width-expand""><h4 class="za-comment-title za-margin-remove"><span class="za-link-reset">' + res.message.username + '</span></h4><ul class="za-comment-meta za-subnav za-subnav-divider za-margin-remove-top" style="border-bottom:1px solid #ddd"><li><span>' + new Date(parseInt(res.message.timestamp, 10) * 1000).toLocaleString() + '</span></li><li><span class="zoia-msg-edit" data="' + res.message.id + '">' + lang['Edit'] + '</span></li><li><span class="zoia-msg-delete" data="' + res.message.id + '">' + lang['Delete'] + '</span></li></ul></div></header><div class="za-comment-body"><p class="zoia-msg-text" data="' + res.message.id + '">' + res.message.message.replace(/\n/gm, '<br>') + '</p></div></article>';
                    $('#zoia_support_messages').prepend(supportMessagesHTML);
                    bindMessageHandlers();
                }
                supportMessageDialog.hide();
            } else {
                $('#zoiaSpinnerDark').hide();
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaSpinnerDark').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const initUploader = () => {
        const bar = document.getElementById('zoia_upload_progressbar');
        $zUI.upload('.zoia-upload', {
            url: '/api/support/request/upload',
            multiple: true,
            beforeAll: function() {
                this.params.id = currentSupportRequestID;
            },
            error: function() {
                bar.setAttribute('hidden', 'hidden');
                $zUI.modal.alert(lang['Could not upload file to server. Please check file name and size, then try again.'], { labels: { ok: lang['OK'] }, stack: true });
            },
            loadStart: function(e) {
                bar.removeAttribute('hidden');
                bar.max = e.total;
                bar.value = e.loaded;
            },
            progress: function(e) {
                bar.max = e.total;
                bar.value = e.loaded;
            },
            loadEnd: function(e) {
                bar.max = e.total;
                bar.value = e.loaded;
            },
            completeAll: function(data) {
                let res = {};
                try {
                    res = JSON.parse(data.response);
                } catch (e) {
                    // Ignore
                }
                if (res.status && res.status === 1) {
                    let filesHTML = '';
                    for (let i in res.files) {
                        const file = res.files[i];
                        filesHTML += '<div><span za-icon="icon:trash" class="zoia-attachment-delete" data-id="' + currentSupportRequestID + '" data-fid="' + file.id + '"></span>&nbsp;<a href="/api/support/download?id=' + currentSupportRequestID + '&fid=' + file.id + '" target="_blank">' + file.filename + '</a></div>';
                    }
                    $('#zoia_attachments').html(filesHTML);
                    bindDeleteAttachmentHandlers();
                } else if (res.error) {
                    $zUI.modal.alert(res.error, { labels: { ok: lang['OK'] }, stack: true });
                } else {
                    $zUI.modal.alert(lang['Could not upload file to server. Please check file name and size, then try again.'], { labels: { ok: lang['OK'] }, stack: true });
                }
                setTimeout(function() {
                    bar.setAttribute('hidden', 'hidden');
                }, 1000);
            }
        });
    };

    const btnCommonSaveClickHandler = (callback) => {
        $('#zoia_support_title').removeClass('za-form-danger');
        const title = $('#zoia_support_title').val().trim();
        const status = $('#zoia_support_status').val();
        const priority = $('#zoia_support_priority').val();
        if (!title || title.length > 512) {
            return $('#zoia_support_title').addClass('za-form-danger').focus();
        }
        $('#zoiaSpinnerWhite').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/request/common/save',
            cache: false,
            data: {
                id: currentSupportRequestID,
                title: title,
                status: status,
                priority: priority
            }
        }).done((res) => {
            setTimeout(() => {
                $('#zoiaSpinnerWhite').hide();
            }, 300);
            if (res && res.status === 1) {
                currentData.status = parseInt($('#zoia_support_status').val(), 10);
                currentData.priority = parseInt($('#zoia_support_priority').val(), 10);
                currentData.title = $('#zoia_support_title').val();
                $zUI.notification(lang['Data has been saved successfully'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
            if (callback) {
                callback();
            }
        }).fail(() => {
            setTimeout(() => {
                $('#zoiaSpinnerWhite').hide();
            }, 300);
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
            if (callback) {
                callback();
            }
        }, 200);
    };

    const zoiaDeleteButtonClickHandler = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let names = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                names.push($('#support').zoiaTable().getCurrentData()[id[i]]._id + ' (' + $('#support').zoiaTable().getCurrentData()[id[i]].title + ')');
            }
        } else {
            items.push(id);
            names.push($('#support').zoiaTable().getCurrentData()[id]._id + ' (' + $('#support').zoiaTable().getCurrentData()[id].title + ')');
        }
        $zUI.modal.confirm(lang['The following support request(s) will be removed. Continue?'] + '<br><br>' + names.join('<br>'), { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(function() {
            $('#zoiaSpinnerWhite').show();
            $.ajax({
                type: 'POST',
                url: '/api/support/request/delete',
                data: {
                    id: items
                },
                cache: false
            }).done((res) => {
                $('#zoiaSpinnerWhite').hide();
                $('#support').zoiaTable().load();
                $zUI.notification((res && res.status === 1) ? lang['Operation was successful'] : lang['Cannot delete one or more items'], {
                    status: (res && res.status === 1) ? 'success' : 'danger',
                    timeout: 1500
                });
            }).fail(() => {
                $('#zoiaSpinnerWhite').hide();
                $('#support').zoiaTable().load();
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        });
    };

    const supportBtnRefreshClick = () => {
        $('#support').zoiaTable().load();
    };

    const pickupTicketHandler = () => {
        ajaxPickUp(true);
    };

    const releaseTicketHandler = () => {
        ajaxPickUp(false);
    };

    $(document).ready(() => {
        currentUsername = $('#zp_currentUsername').attr('data');
        const locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/support/${locale}.js`).done(() => {
            $('#support').zoiaTable({
                url: '/api/support/list',
                limit: 20,
                sort: {
                    field: '_id',
                    direction: 'desc'
                },
                fields: {
                    _id: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    timestamp: {
                        sortable: true,
                        process: (id, item, value) => {
                            return new Date(parseInt(value, 10) * 1000).toLocaleString().replace(/\s/gm, '&nbsp;');
                        }
                    },
                    username: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            if (item.unreadSupport) {
                                value = '<span class="za-icon-button" za-icon="icon:mail;ratio:0.6" style="background:#FFB03B;color:#fff;width:20px;height:20px;"></span>&nbsp;' + value;
                            }
                            return value;
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.statuses[value];
                        }
                    },
                    specialist: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value ? value : '&ndash;';
                        }
                    },
                    priority: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.priorities[value] ? lang.priorities[value].replace(/\s/g, '&nbsp;') : '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            if (item && item.groupname === 'admin') {
                                return '&ndash;';
                            }
                            return '<button class="za-icon-button zoia-support-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-support-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-support-action-edit-btn').click(function() {
                        $('#zoiaSpinnerDark').show();
                        currentSupportRequestID = $(this).attr('data');
                        loadSupportRequest();
                    });
                    $('.zoia-support-action-del-btn').click(function() {
                        zoiaDeleteButtonClickHandler($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            supportDialog = $zUI.modal('#supportDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            supportMessageDialog = $zUI.modal('#supportMessageDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            for (let i in lang.statuses) {
                $('#zoia_support_status').append('<option value="' + i + '">' + lang.statuses[i] + '</option>');
            }
            for (let i in lang.priorities) {
                $('#zoia_support_priority').append('<option value="' + i + '">' + lang.priorities[i] + '</option>');
            }
            $('#zoia_btn_message_add').click(() => {
                currentSupportMessageID = null;
                $('#zoia_support_msg').removeClass('za-form-danger').val('');
                supportMessageDialog.show().then(() => {
                    $('#zoia_support_msg').focus();
                });
            });
            $('#zoia_btn_message_save').click(btnMessageSaveClickHandler);
            $('#zoia_common_save').click(btnCommonSaveClickHandler);
            $('.zoiaDeleteButton').click(function() {
                const checked = $('.supportCheckbox:checkbox:checked').map(function() {
                    return this.id;
                }).get();
                if (checked && checked.length > 0) {
                    zoiaDeleteButtonClickHandler(checked);
                }
            });
            $('#zoia_common_pickup').click(pickupTicketHandler);
            $('#zoia_common_release').click(releaseTicketHandler);
            $('#zoia_btn_ticket_done').click(() => {
                if (parseInt(currentData.status, 10) !== parseInt($('#zoia_support_status').val(), 10) ||
                    parseInt(currentData.priority, 10) !== parseInt($('#zoia_support_priority').val(), 10) ||
                    currentData.title !== $('#zoia_support_title').val()) {
                    $zUI.modal.confirm(lang['There are unsaved changes. Save?'], { labels: { ok: lang['Yes'], cancel: lang['No'] }, stack: true }).then(function() {
                        btnCommonSaveClickHandler(() => {
                            if (parseInt($('#zoia_support_status').val(), 10) === 0) {
                                ajaxPickUp(false, true, true);
                            } else {
                                $('#support').zoiaTable().load();
                            }
                        });
                    });
                } else if (parseInt($('#zoia_support_status').val(), 10) === 0) {
                    ajaxPickUp(false, true, true);
                } else {
                    $('#support').zoiaTable().load();
                }
            });
            $('.supportBtnRefresh').click(supportBtnRefreshClick);
            initUploader();
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();