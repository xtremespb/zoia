/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-len: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let deleteDialog;
    let currentEditID;
    let currentDeleteID;
    let editShadow = {};
    let editLanguage;
    let keywords;

    let locale;
    let useCodemirror;
    let langs;
    let templates;
    let uprefix;
    let codemirror;
    let corePrefix;
    // let testMode;

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

    const editSpinner = (show) => {
        if (show) {
            $('.editForm-form-button').hide();
            $('#zoiaEditSpinner').show();
        } else {
            $('.editForm-form-button').show();
            $('#zoiaEditSpinner').hide();
        }
    };

    const deleteDialogSpinner = (show) => {
        if (show) {
            $('.zoia-delete-dialog-button').hide();
            $('#zoiaDeleteDialogSpinner').show();
        } else {
            $('.zoia-delete-dialog-button').show();
            $('#zoiaDeleteDialogSpinner').hide();
        }
    };

    const createItem = () => {
        $('#wrapTable').hide();
        $('#zoiaEdit').show();
        $('#zoiaEditHeader').html(lang.addItem);
        for (let lng in langs) {
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
        }
        $('#editForm').zoiaFormBuilder().resetForm();
        currentEditID = null;
        editLanguage = Object.keys(langs)[0];
        // $('#zoiaEditLanguages > li[data=' + editLanguage + ']').click();
        markZoiaLanguagesTab(editLanguage);
        $('#editForm_content').val('');
        keywords.setValue('');
        if (useCodemirror && !codemirror) {
            codemirror = CodeMirror.fromTextArea(document.getElementById('editForm_content'), {
                mode: 'htmlmixed',
                lineWrapping: true,
                lineNumbers: true
            });
            window.zoiaCodeMirror = codemirror;            
        }
        if (useCodemirror) {
            codemirror.setValue('');
            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
        }
        $('#editForm_timestamp').val(moment().locale(locale).format(lang.dateTimeTemplate));
    };

    const showTable = () => {
        $('#wrapTable').show();
        $('#zoiaEdit').hide();
    };

    const editItem = (id) => {
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]{1,10}$/)) {
            return showTable();
        }
        currentEditID = id;
        for (let lng in langs) {
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
        }
        $('#wrapTable').hide();
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#zoiaEditHeader').html(lang.editItem);
        editLanguage = Object.keys(langs)[0];
        markZoiaLanguagesTab(editLanguage);
        $('#zoiaSpinnerMain').show();
        $('#editForm').zoiaFormBuilder().loadData({ id: id });
    };

    const deleteItem = (id) => {
        if (!id) {
            return showTable();
        }
        let items = [];
        let names = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                names.push($('#blog').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            names.push($('#blog').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteDialogList').html('');
        for (let n in names) {
            $('#zoiaDeleteDialogList').append('<li>' + names[n] + '</li>');
        }
        deleteDialogSpinner(false);
        deleteDialog.show();
    };

    const deleteComment = (id) => {
        if (!id) {
            return showTable();
        }
        let items = [];
        let names = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                names.push($('#comments').zoiaTable().getCurrentData()[id[i]].comment);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            names.push($('#comments').zoiaTable().getCurrentData()[id].comment);
        }
        let html = '<ul class="za-list za-list-divider">';
        for (let n in names) {
            html += '<li>' + names[n] + '</li>';
        }
        html += '</ul>';
        $zUI.modal.confirm(lang['The following comment(s) will be deleted. Continue?'] + '<br><br>' + html, { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(() => {
            $('#zoiaSpinnerMain').show();
            $.ajax({
                type: 'POST',
                url: '/api/blog/comments/remove',
                data: {
                    commentId: currentDeleteID
                },
                cache: false
            }).done((res) => {
                setTimeout(() => {
                    $('#zoiaSpinnerMain').hide();
                }, 700);
                $('#comments').zoiaTable().load();
                if (res && res.status === 1) {
                    deleteDialog.hide();
                    $zUI.notification(lang['Operation was successful'], {
                        status: 'success',
                        timeout: 1500
                    });
                } else {
                    $zUI.notification(lang['Cannot delete one or more items'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                setTimeout(() => {
                    $('#zoiaSpinnerMain').hide();
                }, 700);
                $('#comments').zoiaTable().load();
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        }, () => {});
    };

    const ajaxDeleteItem = () => {
        deleteDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/blog/delete',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#blog').zoiaTable().load();
            if (res && res.status === 1) {
                deleteDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteDialogSpinner(false);
            }
        }).fail(() => {
            $('#blog').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteDialogSpinner(false);
        });
    };

    const processState = (eventState) => {
        const state = eventState || {
            action: getUrlParam('action'),
            id: getUrlParam('id')
        };
        switch (state.action) {
            case 'edit':
                editItem(state.id);
                break;
            case 'create':
                createItem();
                break;
            default:
                showTable();
                break;
        }
    };

    const onEditLanguageCheckboxClickEvent = () => {
        if ($('#zoiaEditLanguageCheckbox').prop('checked')) {
            $('#editForm').zoiaFormBuilder().resetForm();
            keywords.setValue('');
            editShadow[editLanguage].enabled = true;
            editShadow[editLanguage].data = {};
            for (let lng in langs) {
                if (editShadow[lng].data) {
                    if (editShadow[lng].data.template) {
                        $('#editForm_template').val(editShadow[lng].data.template.value);
                    }
                    if (editShadow[lng].data.status) {
                        $('#editForm_status').val(editShadow[lng].data.status.value);
                    }
                    if (editShadow[lng].data.timestamp) {
                        $('#editForm_timestamp').val(editShadow[lng].data.timestamp.value);
                    }
                    if (editShadow[lng].data.comments) {
                        $('#editForm_comments').val(editShadow[lng].data.comments.value);
                    }
                }
            }
            $('#editForm_content').val('');
            $('#editForm').show();
            if (useCodemirror) {
                codemirror.setValue('');
                codemirror.clearHistory();
            }
        } else {
            editShadow[editLanguage].enabled = false;
            if (useCodemirror) {
                codemirror.setValue('');
            }
            $('#editForm').hide();
        }
    };

    const initEditor = () => {
        window.setTimeout(function() {
            if (useCodemirror) {
                $(window).bind('popstate',
                    (event) => {
                        processState(event.originalEvent.state);
                    });
                $(window).resize(function() {
                    if (codemirror) {
                        codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
                    }
                });
                processState();
            } else {
                const ckeditor = $('#editForm_content').ckeditor({
                    filebrowserImageBrowseUrl: uprefix + corePrefix.admin + '/pages/browse',
                    filebrowserBrowseUrl: uprefix + corePrefix.admin + '/pages/browse',
                    filebrowserWindowWidth: 800,
                    filebrowserWindowHeight: 500,
                    allowedContent: true
                }).editor;
                ckeditor.on('instanceReady', function() {
                    $(window).bind('popstate',
                        (event) => {
                            processState(event.originalEvent.state);
                        });
                    processState();
                });
            }
        }, 0);
    };

    const markZoiaLanguagesTab = (n) => {
        $('#zoiaEditLanguages > li').removeClass('za-active');
        $('#zoiaEditLanguages > li[data=' + n + ']').addClass('za-active');
    };

    const onZoiaEditLanguagesClick = (lng) => {
        if (!editShadow[lng].enabled) {
            editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
            editLanguage = lng;
            $('#zoiaEditLanguageCheckbox').prop('checked', false);
            $('#editForm').hide();
            return;
        }
        $('#zoiaEditLanguageCheckbox').prop('checked', true);
        if (lng === editLanguage) {
            return $('#editForm').zoiaFormBuilder().deserialize(editShadow[editLanguage].data);
        }
        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
        if (editShadow[editLanguage].enabled && editShadow[editLanguage].data &&
            editShadow[editLanguage].data.status) {
            const saveStatus = editShadow[editLanguage].data.status;
            const saveTemplate = editShadow[editLanguage].data.template;
            const saveTimestamp = editShadow[editLanguage].data.timestamp;
            const saveComments = editShadow[editLanguage].data.comments;
            editShadow[lng].data.template = saveTemplate;
            editShadow[lng].data.status = saveStatus;
            editShadow[lng].data.timestamp = saveTimestamp;
            editShadow[lng].data.comments = saveComments;
            if (useCodemirror) {
                editShadow[editLanguage].data.content.value = codemirror.getValue();
            }
        }
        editLanguage = lng;
        markZoiaLanguagesTab(editLanguage);
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#editForm').zoiaFormBuilder().deserialize(editShadow[editLanguage].data);
        keywords.setValue(editShadow[editLanguage].data.keywords.value);
        $('#editForm').show();
        if (useCodemirror) {
            codemirror.setValue(editShadow[editLanguage].data.content.value);
            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
        }
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        useCodemirror = $('#zp_codemirror').attr('data') === 'true' ? true : false;
        uprefix = $('#zp_uprefix').attr('data');
        langs = JSON.parse($('#zp_langs').attr('data'));
        templates = JSON.parse($('#zp_templates').attr('data'));
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        // testMode = Boolean($('#zp_testMode').attr('data'));
        $.getScript(`/api/lang/blog/${locale}.js`).done(() => {
            deleteDialog = $zUI.modal('#zoiaDeleteDialog', {
                bgClose: false,
                escClose: false
            });
            $('.zoiaDeleteButton').click(function() {
                const checked = $('.blogCheckbox:checkbox:checked').map(function() {
                    return this.id;
                }).get();
                if (checked && checked.length > 0) {
                    deleteItem(checked);
                }
            });
            $('.zoiaDeleteCommentsButton').click(function() {
                const checked = $('.commentsCheckbox:checkbox:checked').map(function() {
                    return this.id;
                }).get();
                if (checked && checked.length > 0) {
                    deleteComment(checked);
                }
            });
            $('#zoiaDeleteDialogButton').click(() => {
                ajaxDeleteItem();
            });
            $('#editForm').zoiaFormBuilder({
                save: {
                    url: '/api/blog/save',
                    method: 'POST'
                },
                load: {
                    url: '/api/blog/load',
                    method: 'GET'
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
                events: {
                    onSaveValidate: (data) => {
                        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
                        if (useCodemirror) {
                            editShadow[editLanguage].data.content.value = codemirror.getValue();
                        }
                        let saveTemplate = editShadow[editLanguage].data.template.value;
                        let saveStatus = editShadow[editLanguage].data.status.value;
                        let saveComments = editShadow[editLanguage].data.comments.value;
                        const timestampMoment = moment(editShadow[editLanguage].data.timestamp.value, lang.dateTimeTemplate);
                        if (!timestampMoment.isValid()) {
                            $('#editForm_timestamp').addClass('za-form-danger');
                            $('#editForm_timestamp_error_text>span').html(lang['Doesn\'t match required format']);
                            $('#editForm_timestamp_error_text').show();
                            return '__stop';
                        }
                        const saveTimestamp = parseInt(timestampMoment.valueOf() / 1000, 10);
                        for (let n in editShadow) {
                            if (!editShadow[n].enabled) {
                                continue;
                            }
                            let lngdata = editShadow[n].data;
                            let vr = $('#editForm').zoiaFormBuilder().validate(lngdata);
                            if (Object.keys(vr.errors).length > 0) {
                                markZoiaLanguagesTab(n);
                                onZoiaEditLanguagesClick(n);
                                vr = $('#editForm').zoiaFormBuilder().validate($('#editForm').zoiaFormBuilder().serialize());
                                if ($('#editForm').zoiaFormBuilder().errors(vr.errors)) {
                                    return '__stop';
                                }
                            }
                            vr.data.template = saveTemplate;
                            vr.data.timestamp = saveTimestamp;
                            vr.data.status = saveStatus;
                            vr.data.comments = saveComments;
                            data[n] = vr.data;
                        }
                        data.id = currentEditID;
                        editSpinner(true);
                        return data;
                    },
                    onSaveSuccess: () => {
                        editSpinner(false);
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                        $('#blog').zoiaTable().load();
                        $('#zoiaEdit').hide();
                        $('#wrapTable').show();
                        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/blog');
                    },
                    onSaveError: (res) => {
                        editSpinner(false);
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $zUI.notification(lang.fieldErrors['Page not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $zUI.notification(lang.fieldErrors['Page already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: (data) => {
                        for (let n in langs) {
                            if (Object.keys(data.item[n]).length < 3) {
                                editShadow[n] = {
                                    enabled: false
                                };
                                continue;
                            }
                            editShadow[n] = {
                                enabled: true,
                                data: {}
                            };
                            editShadow[n].data.title = {
                                type: 'text',
                                value: data.item[n].title
                            };
                            editShadow[n].data.status = {
                                type: 'select',
                                value: data.item.status
                            };
                            editShadow[n].data.template = {
                                type: 'select',
                                value: data.item.template
                            };
                            editShadow[n].data.comments = {
                                type: 'select',
                                value: data.item.comments
                            };
                            editShadow[n].data.timestamp = {
                                type: 'text',
                                value: moment(data.item.timestamp * 1000).locale(locale).format(lang.dateTimeTemplate)
                            };
                            editShadow[n].data.keywords = {
                                type: 'text',
                                value: data.item[n].keywords
                            };
                            editShadow[n].data.content = {
                                type: 'textarea',
                                value: data.item[n].content
                            };
                        }
                        $('#zoiaEditLanguageCheckbox').prop('checked', editShadow[editLanguage].enabled);
                        $('#zoiaEdit').show();
                        $('#zoiaSpinnerMain').hide();
                        if (useCodemirror && !codemirror) {
                            codemirror = CodeMirror.fromTextArea(document.getElementById('editForm_content'), {
                                mode: 'htmlmixed',
                                lineWrapping: true,
                                lineNumbers: true
                            });
                            window.zoiaCodeMirror = codemirror;
                            codemirror.setSize($('#zoia_edit_form_footer').outerWidth() - 3, 300);
                        }
                        for (let n in langs) {
                            if (editShadow[n].enabled) {
                                $('#zoiaEditLanguages > li[data=' + n + ']').click();
                                keywords.setValue(editShadow[editLanguage].data.keywords.value);
                                if (useCodemirror) {
                                    codemirror.setValue(editShadow[editLanguage].data.content.value);
                                }
                                break;
                            }
                        }
                    },
                    onLoadError: () => {
                        $('#zoiaSpinnerMain').hide();
                        $zUI.notification(lang['Could not load information from database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                validation: false,
                items: {
                    title: {
                        type: 'text',
                        label: lang['Title'],
                        autofocus: true,
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Required, max. 128 characters']
                    },
                    timestamp: {
                        type: 'text',
                        label: lang['Date and Time'],
                        css: 'za-width-medium@m',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Required, format'] + ': ' + lang.dateTimeFormat
                    },
                    status: {
                        type: 'select',
                        label: lang['Status'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.statuses[0],
                            1: lang.statuses[1]
                        },
                        default: '1',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1|2)$/
                        }
                    },
                    template: {
                        type: 'select',
                        label: lang['Template'],
                        css: 'za-form-width-small',
                        values: templates,
                        default: templates[0]
                    },
                    comments: {
                        type: 'select',
                        label: lang['Comments'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.Disabled,
                            1: lang.Enabled
                        },
                        default: 1,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1)$/
                        }
                    },
                    keywords: {
                        type: 'tags',
                        label: lang['Keywords'],
                        css: 'za-width-1-1',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Optional, max. 128 characters']
                    },
                    content: {
                        type: 'textarea',
                        label: lang['Content'],
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false
                        },
                        css: 'zoiaFormBuilder-no-reset'
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-edit-buttons-wrap',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default',
                            name: 'btnCancel'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none" id="zoiaEditSpinner"></div>'
                    }
                },
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
                }
            });
            for (let lng in langs) {
                $('#zoiaEditLanguages').append('<li data="' + lng + '"><a href="#">' + langs[lng] + '</a></li>');
                editShadow[lng] = {
                    enabled: true,
                    data: {}
                };
                if (!editLanguage) {
                    editLanguage = lng;
                }
            }
            $('#blog').zoiaTable({
                url: '/api/blog/list',
                limit: 20,
                sort: {
                    field: 'timestamp',
                    direction: 'desc'
                },
                fields: {
                    _id: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    timestamp: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value ? new Date(value * 1000).toLocaleString().replace(/\s/gm, '&nbsp;') : '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.statuses[value] || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-blog-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-blog-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-blog-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/blog?action=edit&id=' + $(this).attr('data'));
                        editItem($(this).attr('data'));
                    });
                    $('.zoia-blog-action-del-btn').click(function() {
                        deleteItem($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            $('#comments').zoiaTable({
                url: '/api/blog/list/comments',
                limit: 20,
                fields: {
                    _id: {
                        sortable: false,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    comment: {
                        sortable: false,
                        process: (id, item) => {
                            const timestamp = new Date(item.timestamp * 1000).toLocaleString().replace(/\s/gm, '&nbsp;');
                            return `<article class="za-comment"><header class="za-text-meta">${item.username} &raquo; ${item.title}&nbsp;&nbsp;(${timestamp})</header><div class="za-comment-body">${item.comment}</div></article>`;
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-comments-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-comments-action-del-btn').click(function() {
                        deleteComment($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            if (useCodemirror) {
                $('#editForm_content').parent().prepend('<div class="za-width-1-1" style="height:40px"><span href="" class="za-icon-button" za-icon="image" style="margin-right:3px" id="zoia_codemirror_image" za-tooltip="' + lang['Insert Image'] + '"></span><span href="" class="za-icon-button" za-icon="more" id="zoia_codemirror_cut" za-tooltip="' + lang['Insert Blog Cut'] + '"></span></div>');
                $('#zoia_codemirror_cut').click(() => {
                    const doc = codemirror.getDoc();
                    const cursor = doc.getCursor();
                    const pos = {
                        line: cursor.line,
                        ch: cursor.ch
                    };
                    doc.replaceRange('{{cut}}', pos);
                    codemirror.focus();
                });
                $('#zoia_codemirror_image').click(() => {
                    const wLeft = window.screenLeft ? window.screenLeft : window.screenX;
                    const wTop = window.screenTop ? window.screenTop : window.screenY;
                    const left = wLeft + (window.innerWidth / 2) - (800 / 2);
                    const top = wTop + (window.innerHeight / 2) - (500 / 2);
                    window.open(uprefix + corePrefix.admin + '/pages/browse', 'targetWindow',
                        `toolbar=no, location = no, status = no, menubar = no, scrollbars = yes, resizable = yes, width = 800, height = 500, top = ${top}, left = ${left}`
                    );
                });
            }
            keywords = tagsInput(document.querySelector('#editForm_keywords'));
            $('.zoiaAdd').click(() => {
                window.history.pushState({ action: 'create' }, document.title, uprefix + corePrefix.admin + '/blog?action=create');
                createItem();
            });
            $('#editForm_btnCancel').click(() => {
                window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/blog');
                $('#zoiaEdit').hide();
                $('#wrapTable').show();
            });
            $('#zoiaEditLanguages > li').click(function() {
                onZoiaEditLanguagesClick($(this).attr('data'));
            });
            $('#zoiaEditLanguageCheckbox').click(function() {
                onEditLanguageCheckboxClickEvent();
            });
            $('.blogBtnRefresh').click(() => {
                $('#blog').zoiaTable().load();
            });
            $('.commentsBtnRefresh').click(() => {
                $('#comments').zoiaTable().load();
            });
            initEditor();
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();