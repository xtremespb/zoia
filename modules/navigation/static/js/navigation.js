/* eslint no-undef: 0 */
/* eslint no-eval: 0 */
/* eslint max-len: 0 */

(() => {
    let navigationDialog;
    let navigationEditDialog;
    let currentLanguage;
    let navigationTree;
    let navigationEditMode;

    let langs;
    let navigationData;

    const navigationDialogSpinner = (show) => {
        if (show) {
            $('.zoia-navigation-dialog-button').hide();
            $('#zoiaNavigationDialogSpinner').show();
        } else {
            $('.zoia-navigation-dialog-button').show();
            $('#zoiaNavigationDialogSpinner').hide();
        }
    };

    const navigationTreeFindRoot = () => {
        const fldrs = navigationTree.jstree(true).get_json(navigationTree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        navigationTree.jstree(true).deselect_all();
        for (let i = 0; i < fldrs.length; i++) {
            if (fldrs[i].parent === '#') {
                navigationTree.jstree(true).select_node(fldrs[i].id);
            }
        }
    };

    const navigationChangedHandler = (e, data) => {
        $('.zoia-navigation-btn').attr('disabled', (data.selected.length ? false : true));
        $('#zoiaNavigationDialogButton').attr('disabled', false);
        if (!data.selected.length || data.selected.length > 1) {
            $('#zoiaNavigationAdd').attr('disabled', true);
            $('#zoiaNavigationEdit').attr('disabled', true);
            $('#zoiaNavigationDialogButton').attr('disabled', true);
        }
        for (let i in data.selected) {
            if (navigationTree.jstree(true).get_parent(data.selected[i]) === '#') {
                $('#zoiaNavigationEdit').attr('disabled', true);
                $('#zoiaNavigationDelete').attr('disabled', true);
            }
        }
    };

    const initNavigationTree = (data) => {
        if (navigationTree) {
            navigationTree.jstree(true).destroy();
        }
        navigationTree = $('#zoia_navigation_tree').jstree({
            core: {
                check_callback: true,
                data: data
            },
            plugins: ['dnd', 'unique', 'types'],
            types: {
                '#': {
                    max_children: 1,
                    valid_children: ['root']
                },
                'root': {
                    valid_children: ['folder']
                },
                'folder': {
                    valid_children: ['folder']
                }
            }
        });
        navigationTree.on('loaded.jstree', () => {
            navigationTree.jstree(true).open_all('#');
            navigationTreeFindRoot();
        });
        navigationTree.on('changed.jstree', (e, _data) => {
            navigationChangedHandler(e, _data);
        });
    };

    const serializeNavigation = () => {
        let result = navigationTree.jstree(true).get_json(navigationTree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        for (let i in result) {
            delete result[i].li_attr;
            delete result[i].a_attr;
            delete result[i].icon;
            delete result[i].state;
        }
        if (result[0] && result[0].data) {
            delete result[0].data;
        }
        return result;
    };

    const saveNavigation = () => {
        navigationData[currentLanguage] = serializeNavigation();
        navigationDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/navigation/save',
            data: { navigation: navigationData },
            cache: false
        }).done((res) => {
            navigationDialogSpinner(false);
            if (res && res.status === 1) {
                $zUI.notification(lang['Navigation data has been saved'], {
                    status: 'success',
                    timeout: 1500
                });
                navigationDialog.hide();
            } else {
                $zUI.notification(lang['Could not save to the database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            navigationDialogSpinner(false);
            $zUI.notification(lang['Could not save to the database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        langs = JSON.parse($('#zp_langs').attr('data'));
        navigationData = eval('(' + $('#zp_navigationData').attr('data') + ')');
		rxp = JSON.parse($('#zp_rxp').attr('data'));
        $.getScript(`/api/lang/navigation/${locale}.js`).done(() => {
            navigationDialog = $zUI.modal('#zoiaNavigationDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            navigationEditDialog = $zUI.modal('#zoiaNavigationEditDialog', {
                bgClose: false,
                escClose: false,
                stack: true
            });
            for (let i in langs) {
                $('#navigation').append('<tr><td>' + langs[i] + '</td><td><button class="za-icon-button zoia-action-edit-btn" style="float:right" za-icon="icon:pencil" data="' + i + '"></button></td></tr>');
            }
            $('#editNavigationForm').zoiaFormBuilder({
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                formDangerClass: 'za-form-danger',
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
                    onSaveValidate: () => {
                        let sel = navigationTree.jstree(true).get_selected();
                        if (navigationEditMode) {
                            navigationTree.jstree(true).rename_node(sel, $('#editNavigationForm_title').val());
                            navigationTree.jstree(true).get_node(sel).data = {};
                            navigationTree.jstree(true).get_node(sel).data.url = $('#editNavigationForm_url').val();
                            navigationTree.jstree(true).open_node(sel);
                            navigationEditDialog.hide();
                            navigationModified = true;
                        } else {
                            let cn = navigationTree.jstree(true).create_node(sel, {
                                text: $('#editNavigationForm_title').val(),
                                type: 'folder'
                            });
                            if (!cn) {
                                $zUI.notification(lang['Duplicate item'], {
                                    status: 'danger',
                                    timeout: 1500
                                });
                                $('#editNavigationForm_title').focus();
                                return '__stop';
                            }
                            navigationTree.jstree(true).get_node(cn).data = {};
                            navigationTree.jstree(true).get_node(cn).data.url = $('#editNavigationForm_url').val();
                            navigationTree.jstree(true).open_node(sel);
                            navigationEditDialog.hide();
                        }
                        return '__stop';
                    }
                },
                items: {
                    title: {
                        type: 'text',
                        label: lang['Title'],
                        css: 'za-width-1-1',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['1-64 characters']
                    },
                    url: {
                        type: 'text',
                        label: lang['URL'],
                        css: 'za-width-1-1',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: rxp.pageURL,
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="float:right;display:none" id="zoiaEditDialogSpinner"></div>'
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
            $('.zoia-action-edit-btn').click(function() {
                currentLanguage = $(this).attr('data');
                initNavigationTree(navigationData[currentLanguage]);
                $('#zoiaNavigationDialogTitle').html(langs[currentLanguage]);
                navigationDialog.show();
            });
            $('#zoiaNavigationAdd').click(() => {
                $('#editNavigationForm').zoiaFormBuilder().resetForm();
                navigationEditDialog.show();
                navigationEditMode = false;
                $('#editNavigationForm_title').focus();
            });
            $('#zoiaNavigationEdit').click(() => {
                let sel = navigationTree.jstree(true).get_selected();
                if (!sel || !sel.length || navigationTree.jstree(true).get_parent(sel) === '#') {
                    return;
                }
                $('#editNavigationForm').zoiaFormBuilder().resetForm();
                $('#editNavigationForm_title').val(navigationTree.jstree(true).get_node(sel).text);
                $('#editNavigationForm_url').val(navigationTree.jstree(true).get_node(sel).data.url);
                navigationEditDialog.show();
                $('#editNavigationForm_title').focus();
                navigationEditMode = true;
            });
            $('#zoiaNavigationDelete').click(() => {
                let sel = navigationTree.jstree(true).get_selected();
                if (!sel || !sel.length || navigationTree.jstree(true).get_parent(sel) === '#') {
                    return;
                }
                navigationTree.jstree(true).delete_node(sel);
                navigationTreeFindRoot();
                navigationModified = true;
            });
            $('#zoiaNavigationRevert').click(() => {
                initNavigationTree([{ id: 'j1_1', text: '/', data: { url: '/' }, parent: '#', type: 'root' }]);
            });
            $('#zoiaNavigationDialogButton').click(saveNavigation);
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();