/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint no-nested-ternary: 0 */
/* eslint no-use-before-define: 0 */

(() => {
    let currentSupportRequestID;
    let supportMessageDialog;

    let locale;
    let currentUsername;
    let uprefix;

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

    const deleteAttachment = (id, fid) => {
        $('.zoia-attachment-delete[data-fid="' + fid + '"]').parent().hide();
        $.ajax({
            type: 'POST',
            url: '/api/support/frontend/attachment/delete',
            cache: false,
            data: {
                id: id,
                fid: fid
            }
        }).done((res) => {
            if (res && res.status === 1) {
                $('.zoia-attachment-delete[data-fid="' + fid + '"]').parent().remove();
            } else {
                $('.zoia-attachment-delete[data-fid="' + fid + '"]').parent().show();
                $zUI.notification(lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('.zoia-attachment-delete[data-fid="' + fid + '"]').parent().show();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const viewTicket = (id) => {
        if (!id || !id.match(/^[0-9]{1,10}$/)) {
            return $zUI.modal.alert(lang['Invalid Ticket ID.'], { labels: { ok: lang['OK'] } });
        }
        currentSupportRequestID = id;
        $('.zoia-wrap-table').hide();
        $('.zoia-wrap-new').hide();
        $('.zoia-ticket-id').html(id);
        $('.zoia-ticket-wrap-data').hide();
        $('.zoia-ticket-wrap-loading').show();
        $('.zoia-wrap-view').show();
        $.ajax({
            type: 'GET',
            url: '/api/support/frontend/load',
            cache: false,
            data: {
                id: id
            }
        }).done((res) => {
            if (res && res.status === 1) {
                $('#support').zoiaTable().load();
                $('.zoia-ticket-title').html(res.data.title);
                $('.zoia-ticket-timestamp').html(new Date(res.data.timestamp * 1000).toLocaleString());
                $('.zoia-ticket-status').removeClass('za-label-success').removeClass('za-label-warning');
                switch (res.data.status) {
                    case 1:
                        $('.zoia-ticket-status').addClass('za-label-warning');
                        break;
                    case 2:
                        $('.zoia-ticket-status').addClass('za-label-success');
                        break;
                    default:
                        break;
                }
                if (res.data.messages) {
                    res.data.messages.sort(function(a, b) {
                        return (a.timestamp > b.timestamp) ? -1 : ((b.timestamp > a.timestamp) ? 1 : 0);
                    });
                }
                let messagesHTML = '';
                for (let i in res.data.messages) {
                    let cc = '';
                    if (res.data.messages[i].username !== currentUsername) {
                        cc = ' zoia-reply-msg';
                    }
                    messagesHTML += '<article class="za-comment za-margin za-card za-card-default za-card-small za-card-body' + cc + '"><header class="za-comment-header za-grid-medium za-flex-middle" za-grid><div class="za-width-expand""><h4 class="za-comment-title za-margin-remove"><span class="za-link-reset">' + res.data.messages[i].username + '</span></h4><ul class="za-comment-meta za-subnav za-subnav-divider za-margin-remove-top" style="border-bottom:1px solid #ddd"><li><span>' + new Date(parseInt(res.data.messages[i].timestamp, 10) * 1000).toLocaleString() + '</span></li></ul></div></header><div class="za-comment-body"><p class="zoia-msg-text">' + res.data.messages[i].message.replace(/\n/gm, '<br>') + '</p></div></article>';
                }
                let filesHTML = '';
                for (let i in res.data.files) {
                    const file = res.data.files[i];
                    filesHTML += '<div><span za-icon="icon:trash" class="zoia-attachment-delete" data-id="' + currentSupportRequestID + '" data-fid="' + file.id + '"></span>&nbsp;<a href="/api/support/download?id=' + currentSupportRequestID + '&fid=' + file.id + '" target="_blank">' + file.filename + '</a></div>';
                }
                $('#zoia_attachments').html(filesHTML);
                bindDeleteAttachmentHandlers();
                $('.zoia-ticket-messages').html(messagesHTML);
                $('.zoia-ticket-status').html(lang.statuses[res.data.status]);
                $('.zoia-ticket-wrap-loading').hide();
                $('.zoia-ticket-wrap-data').show();
            } else {
                $('.zoia-wrap-view').hide();
                $('.zoia-wrap-table').show();
                window.history.go(-1);
                $zUI.notification(res.error ? res.error : lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('.zoia-wrap-view').hide();
            $('.zoia-wrap-table').show();
            window.history.go(-1);
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const createTicketFormSubmit = (e) => {
        e.preventDefault();
        const title = $('#zoia_ct_title').val().trim();
        const message = $('#zoia_ct_message').val().trim();
        const priority = parseInt($('#zoia_ct_priority').val(), 10);
        $('.zoia-ct-field').removeClass('za-form-danger');
        $('#zoia_ct_form_error').hide();
        if (!title || title.length < 2 || title.length > 128) {
            $('#zoia_ct_form_error').show();
            return $('#zoia_ct_title').focus().addClass('za-form-danger');
        }
        if (!message || message.length < 2 || message.length > 4096) {
            $('#zoia_ct_form_error').show();
            return $('#zoia_ct_message').focus().addClass('za-form-danger');
        }
        $('#zoia_ct_btn_create_spinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/frontend/create',
            cache: false,
            data: {
                title: title,
                message: message,
                priority: priority
            }
        }).done((res) => {
            $('#zoia_ct_btn_create_spinner').hide();
            if (res && res.status === 1) {
                window.history.pushState({ action: 'view', id: res.id }, document.title, uprefix + '/support?action=view&id=' + res.id);
                viewTicket(String(res.id));
            } else {
                $zUI.notification(res.error ? res.error : lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoia_ct_btn_create_spinner').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const getUrlParam = (sParam) => {
        let sPageURL = decodeURIComponent(window.location.search.substring(1));
        let sURLVariables = sPageURL.split('&');
        let sParameterName;
        let i;
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    const initUploader = () => {
        const bar = document.getElementById('zoia_upload_progressbar');
        $zUI.upload('.zoia-upload', {
            url: '/api/support/frontend/upload',
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
                    if (res.files) {
                        let filesHTML = '';
                        for (let i in res.files) {
                            const file = res.files[i];
                            filesHTML += '<div><span za-icon="icon:trash" class="zoia-attachment-delete" data-id="' + currentSupportRequestID + '" data-fid="' + file.id + '"></span>&nbsp;<a href="/api/support/download?id=' + currentSupportRequestID + '&fid=' + file.id + '" target="_blank">' + file.filename + '</a></div>';
                        }
                        $('#zoia_attachments').html(filesHTML);
                        bindDeleteAttachmentHandlers();
                    }
                } else {
                    $zUI.modal.alert(lang['Could not upload file to server. Please check file name and size, then try again.'], { labels: { ok: lang['OK'] }, stack: true });
                }
                setTimeout(function() {
                    bar.setAttribute('hidden', 'hidden');
                }, 1000);
            }
        });
    };

    const btnMessageSaveClickHandler = () => {
        $('.zoia-md-field').removeClass('za-form-danger');
        const msg = $('#zoia_md_message').val().trim();
        if (!msg || msg.length < 2 || msg.length > 4096) {
            return $('#zoia_md_message').addClass('za-form-danger').focus();
        }
        $('.zoia-md-button').hide();
        $('#zoia_btn_message_save_spinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/support/frontend/message',
            cache: false,
            data: {
                id: currentSupportRequestID,
                message: msg
            }
        }).done((res) => {
            $('.zoia-md-button').show();
            $('#zoia_btn_message_save_spinner').hide();
            if (res && res.status === 1) {
                const supportMessagesHTML = '<article class="za-comment za-margin za-card za-card-default za-card-small za-card-body"><header class="za-comment-header za-grid-medium za-flex-middle" za-grid><div class="za-width-expand""><h4 class="za-comment-title za-margin-remove"><span class="za-link-reset">' + res.message.username + '</span></h4><ul class="za-comment-meta za-subnav za-subnav-divider za-margin-remove-top" style="border-bottom:1px solid #ddd"><li><span>' + new Date(parseInt(res.message.timestamp, 10) * 1000).toLocaleString() + '</span></li></ul></div></header><div class="za-comment-body"><p class="zoia-msg-text">' + res.message.message + '</p></div></article>';
                $('.zoia-ticket-messages').prepend(supportMessagesHTML);
                supportMessageDialog.hide();
            } else {
                $zUI.notification(res.error ? res.error : lang['Error while loading data'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('.zoia-md-button').show();
            $('#zoia_btn_message_save_spinner').hide();
            $zUI.notification(lang['Error while loading data'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const processState = (eventState) => {
        const state = eventState || {
            action: getUrlParam('action'),
            id: getUrlParam('id')
        };
        switch (state.action) {
            case 'view':
                viewTicket(state.id);
                break;
            case 'create':
                createTicket();
                break;
            default:
                $('.zoia-wrap-new').hide();
                $('.zoia-wrap-view').hide();
                $('.zoia-wrap-table').show();
                break;
        }
    };

    const createTicket = () => {
        $('.zoia-wrap-table').hide();
        $('.zoia-wrap-new').show();
        $('.zoia-ct-field').val('');
        $('#zoia_ct_priority').val(3);
        $('#zoia_ct_title').focus();
        $('#zoia_ct_form_error').hide();
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        currentUsername = $('#zp_currentUsername').attr('data');
        uprefix = $('#zp_uprefix').attr('data');
        $.getScript(`/api/lang/support/${locale}.js`).done(() => {
            $('#support').zoiaTable({
                url: '/api/support/frontend/list',
                limit: 10,
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
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            if (item.unreadUser) {
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
                                '" style="margin-right:5px"></button>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-support-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'view', id: $(this).attr('data') }, document.title, uprefix + '/support?action=view&id=' + $(this).attr('data'));
                        viewTicket($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            for (let i in lang.priorities) {
                $('#zoia_ct_priority').append('<option value="' + i + '">' + lang.priorities[i] + '</option>');
            }
            $('#zoia_ct_btn_cancel').click(function(e) {
                e.preventDefault();
                $('.zoia-wrap-new').hide();
                $('.zoia-wrap-table').show();
                window.history.pushState({ action: '' }, document.title, uprefix + '/support');
            });
            $('.zoia-btn-create-ticket').click(() => {
                window.history.pushState({ action: 'create' }, document.title, uprefix + '/support?action=create');
                createTicket();
            });
            $('#zoia_ct_form').submit(createTicketFormSubmit);
            $(window).bind('popstate',
                (event) => {
                    processState(event.originalEvent.state);
                });
            $('.zoia-loading').hide();
            supportMessageDialog = $zUI.modal('#supportMessageDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            $('.zoia-btn-create-msg').click(() => {
                $('.zoia-md-field').removeClass('za-form-danger').val('');
                supportMessageDialog.show().then(() => {
                    $('#zoia_md_message').focus();
                });
            });
            $('#zoia_btn_message_save').click(btnMessageSaveClickHandler);
            $('.zoia-breadcrumb-root').click((e) => {
                e.preventDefault();
                window.history.pushState({ action: '' }, document.title, uprefix + '/support');
                $('.zoia-wrap-new').hide();
                $('.zoia-wrap-view').hide();
                $('.zoia-wrap-table').show();
            });
            initUploader();
            processState();
        });
    });
})();