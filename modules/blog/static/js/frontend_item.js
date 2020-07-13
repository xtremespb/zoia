/* eslint max-len: 0 */
/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */

(() => {
    let locale;
    let postId;
    let commentTemplate;
    let commentRemovedTemplate;
    let newCommentHighlight;

    let parentCommentID;

    const tpl = (s, d) => {
        for (let p in d) {
            s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
        }
        return s;
    };

    const addCommentHTML = (comment) => {
        let level = 1;
        if (comment.parentId) {
            const parentLevel = parseInt($(`.za-comment[data-id="${comment.parentId}"]`).attr('data-level'), 10);
            level = parentLevel + 1;
        }
        const offset = (level - 1) * 20;
        const timestamp = moment(parseInt(comment.timestamp, 10) * 1000).locale(locale).format('L [' + lang['at'] + '] LT');
        const commentHTML = tpl(commentTemplate, {
            id: comment._id,
            level: level,
            offset: offset,
            comment: comment.comment,
            username: comment.username,
            picture: comment.picture,
            timestamp: timestamp
        });
        if (comment.parentId) {
            $(`.za-comment[data-id="${comment.parentId}"]`).parent().append(commentHTML);
        } else {
            $('#zoia_comments').append(commentHTML);
        }
    };

    const addCommentRemovedHTML = (comment, add) => {
        let level = comment.level || 1;
        if (comment.parentId) {
            const parentLevel = parseInt($(`.za-comment[data-id="${comment.parentId}"]`).attr('data-level'), 10);
            level = parentLevel + 1;
        }
        const offset = (level - 1) * 20;
        const commentHTML = tpl(commentRemovedTemplate, {
            id: comment._id,
            level: level,
            offset: offset
        });
        if (add) {
            if (comment.parentId) {
                $(`.za-comment[data-id="${comment.parentId}"]`).parent().append(commentHTML);
            } else {
                $('#zoia_comments').append(commentHTML);
            }
        }
        return commentHTML;
    };

    const addComment = (e, parentId) => {
        if ($('#zoia_btn_addcomment_spinner').is(':visible')) {
            return;
        }
        parentId = parentId || parentCommentID;
        $('#zoia_comment').removeClass('za-form-danger');
        const comment = $('#zoia_comment').val().trim();
        if (!comment || comment.length > 512) {
            return $('#zoia_comment').addClass('za-form-danger').focus();
        }
        $('#zoia_btn_addcomment_spinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/blog/comments/add',
            data: {
                comment: comment,
                parentId: parentId,
                postId: postId
            },
            cache: false
        }).done((res) => {
            $('#zoia_btn_addcomment_spinner').hide();
            if (res && res.status === 1) {
                addCommentHTML({
                    comment: res.comment,
                    _id: res._id,
                    parentId: parentId,
                    username: res.username,
                    picture: res.picture,
                    timestamp: res.timestamp
                });
                newCommentClickHandler(null, 'nofocus');
                $('html, body').animate({
                    scrollTop: $('#' + res._id).offset().top
                }, 200);
                $('#' + res._id).addClass('zoia-comment-new');
                $('#' + res._id).css('background', newCommentHighlight);
                setTimeout(() => {
                    $('#' + res._id).css('background', '');
                }, 500);
                $('.zoia-comment-reply').unbind().click(addReplyClickHandler);
                $('.zoia-comment-remove').unbind().click(addRemoveClickHandler);
            } else {
                $zUI.notification(res.error ? res.error : lang['Could not add your comment'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoia_btn_addcomment_spinner').hide();
            $zUI.notification(lang['Could not add your comment'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const loadComments = () => {
        $.ajax({
            type: 'POST',
            url: '/api/blog/comments/load',
            data: {
                postId: postId
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1) {
                // Render comments
                for (let i in res.comments) {
                    let comment = res.comments[i];
                    comment.username = res.usersData[comment.userId].username;
                    comment.picture = res.usersData[comment.userId].picture;
                    if (comment.comment) {
                        addCommentHTML(comment);
                    } else {
                        addCommentRemovedHTML(comment, true);
                    }
                }
                // Bind handlers
                $('.zoia-comment-reply').unbind().click(addReplyClickHandler);
                $('.zoia-comment-remove').unbind().click(addRemoveClickHandler);
                // Finally                
                $('#zoia_comments_loading').hide();
                $('#zoia_comments_wrap').show();
            }
        }).fail(() => {
            $('#zoia_comments_loading').hide();
            $zUI.notification(lang['Error while loading comments'], {
                status: 'danger',
                timeout: 2500
            });
        });
    };

    const addReplyClickHandler = (e) => {
        e.preventDefault();
        $('.zoia-comment-reply').show();
        $('#zoia_btn_newcomment').show();
        const id = $(e.target).attr('data-id');
        const form = $('.zoia-comment-form').detach();
        $('.zoia-comment-reply[data-id="' + id + '"]').hide().parent().append(form);
        parentCommentID = id;
        $('#zoia_comment').removeClass('za-form-danger');
        $('#zoia_comment').val('').focus();
    };

    const addRemoveClickHandler = (e) => {
        e.preventDefault();
        const id = $(e.target).attr('data-id');
        $zUI.modal.confirm(lang['Are you sure you wish to delete the comment?'], { stack: true, labels: { ok: lang['OK'], cancel: lang['Cancel'] } }).then(() => {
            $('a[data-id="' + id + '"]>.za-spinner').show();
            $.ajax({
                type: 'POST',
                url: '/api/blog/comments/remove',
                data: {
                    commentId: id
                },
                cache: false
            }).done((res) => {
                if (res && res.status === 1) {
                    const level = $('#' + id).attr('data-level');
                    const html = addCommentRemovedHTML({
                        level: level,
                        _id: id
                    }, false);
                    $('#' + id).replaceWith(html);
                } else {
                    $('a[data-id="' + id + '"]>.za-spinner').hide();
                    $zUI.notification(lang['Could not delete a comment'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                $('a[data-id="' + id + '"]>.za-spinner').hide();
                $zUI.notification(lang['Could not delete a comment'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        }, () => {});
    };

    const newCommentClickHandler = (e, nofocus) => {
        $('.zoia-comment-reply').show();
        const form = $('.zoia-comment-form').detach();
        $('#zoia_btn_newcomment').parent().prepend(form);
        $('#zoia_btn_newcomment').hide();
        $('#zoia_comment').val('');
        parentCommentID = null;
        if (!nofocus) {
            $('#zoia_comment').focus();
        }
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        commentTemplate = $('#zp_comment').attr('data');
        commentRemovedTemplate = $('#zp_comment_removed').attr('data');
        newCommentHighlight = $('#zp_newCommentHighlight').attr('data');
        postId = $('#zp_postId').attr('data');
        $.getScript(`/api/lang/blog/${locale}.js`).done(() => {
            $('#zoia_btn_addcomment').click(addComment);
            $('#zoia_btn_newcomment').click(newCommentClickHandler);
            $('#zoia_comment').keydown((e) => {
                if (e.ctrlKey && e.keyCode === 13) {
                    addComment(e);
                }
            });
            loadComments();
        });
    });
})();