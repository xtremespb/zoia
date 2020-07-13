/* eslint-disable react/prop-types, no-loop-func */

import React, { lazy, Component } from 'react';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import cookies from 'zoia-cookies';
import axios from 'axios';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Trans, t } from '@lingui/macro';
import { history } from '../../../../shared/redux/store/configureStore';
import appDataRuntimeSetToken from '../../../../shared/redux/actions/appDataRuntimeSetToken';
import appDataSetUser from '../../../../shared/redux/actions/appDataSetUser';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';
import UIkit from '../../../../shared/lib/uikit';
import DialogFolder from './DialogFolder.jsx';
import templates from '../../../../../dist/etc/templates.json';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));
const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../shared/react/FormBuilder/index.jsx'));

class PagesEdit extends Component {
    constructor(props) {
        super(props);
        this.editPagesForm = React.createRef();
        this.dialogFolder = React.createRef();
    }

    state = {
        loadingError: false
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/admin/users/auth?redirect=/admin/pages');
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        // removeCookie(`${site.id}_auth`);
        cookies.expire(`${this.props.appDataRuntime.config.id}_auth`, undefined, this.props.appDataRuntime.config.cookieOptions);
        history.push(`/admin/users/auth?redirect=/admin/pages`);
    }

    onPagesTableLoadError = data => {
        if (data && data.statusCode === 401) {
            this.deauthorize();
        }
    }

    onSaveSuccessHandler = (res, i18n) => {
        if (res && res.data && res.data.statusCode === 200) {
            UIkit.notification({
                message: i18n._(t`Data has been saved successfully`),
                status: 'success'
            });
            history.push('/admin/pages?reload=1');
        } else if (res && res.data) {
            switch (res.data.errorCode) {
                case 1:
                    UIkit.notification({
                        message: i18n._(t`Duplicate page, check filename and path`),
                        status: 'danger'
                    });
                    break;
                default:
                    UIkit.notification({
                        message: i18n._(t`Could not save a page`),
                        status: 'danger'
                    });
            }
        } else {
            UIkit.notification({
                message: i18n._(t`Could not save a page`),
                status: 'danger'
            });
        }
    }

    loadFoldersData = () => new Promise((resolve, reject) => {
        axios.post(`${this.props.appDataRuntime.config.api.url}/api/pages/folders/load`, {
            token: this.props.appDataRuntime.token,
            language: this.props.appData.language
        }, { headers: { 'content-type': 'application/json' } }).then(async res => {
            if (res && res.data && res.data.statusCode === 200 && res.data.data) {
                resolve(res.data.data);
                return;
            }
            reject(res);
        }).catch(async err => {
            if (err && err.response && err.response.data && err.response.data.statusCode === 401) {
                this.deauthorize();
            }
            reject(err);
        });
    })

    loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item.key === key) {
                callback(item, index, arr);
                return;
            }
            if (item.children) {
                this.loop(item.children, key, callback);
            }
        });
    };

    loopPath = (data, key, callback, path = []) => data.forEach(item => {
        path.push(item.id);
        if (item.key === key) {
            callback(item, path);
        } else if (item.children) {
            this.loopPath(item.children, key, callback, path);
        }
        path.pop();
    });

    onSaveFolderHandler = (i18n, folders) => {
        axios.post(`${this.props.appDataRuntime.config.api.url}/api/pages/folders/save`, {
            token: this.props.appDataRuntime.token,
            folders: folders.tree
        }, { headers: { 'content-type': 'application/json' } }).then(async res => {
            if (res && res.data && res.data.statusCode === 200) {
                return;
            }
            UIkit.notification({
                message: i18n._(t`Could not save data`),
                status: 'danger'
            });
        }).catch(async err => {
            if (err && err.response && err.response.data && err.response.data.statusCode === 401) {
                this.deauthorize();
                return;
            }
            UIkit.notification({
                message: i18n._(t`Could not save data`),
                status: 'danger'
            });
        });
        if (!folders.selected.length) {
            this.editPagesForm.current.setValue('path', '/');
        } else {
            this.loopPath(folders.tree, folders.selected[0], (item, pathArr) => this.editPagesForm.current.setValue('path', `/${pathArr.join('/')}`));
        }
    }

    onSetPathValButtonClick = async (event, i18n) => {
        event.preventDefault();
        try {
            this.editPagesForm.current.setLoading(true);
            const tree = await this.loadFoldersData();
            this.dialogFolder.current.setTreeValues(tree);
            this.editPagesForm.current.setLoading(false);
            this.dialogFolder.current.show();
        } catch (e) {
            this.editPagesForm.current.setLoading(false);
            UIkit.notification({
                message: i18n._(t`Could not load data from server`),
                status: 'danger'
            });
        }
    }

    getTemplatesObject = () => {
        const templatesObject = {};
        templates.available.map(tp => templatesObject[tp] = tp);
        return templatesObject;
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editPagesForm}
        prefix="editPagesForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        commonFields={['path', 'filename', 'template']}
        tabs={this.props.appDataRuntime.config.languages}
        data={
            [
                [{
                    id: 'title',
                    type: 'text',
                    css: 'uk-form-width-large',
                    label: `${i18n._(t`Title`)}:`,
                    autofocus: true,
                    helpText: i18n._(t`Displayed in browser window`)
                },
                {
                    id: 'path',
                    type: 'val',
                    css: 'uk-form-width-medium',
                    label: `${i18n._(t`Path`)}:`,
                    defaultValue: '/',
                    onSetValButtonClick: e => this.onSetPathValButtonClick(e, i18n)
                }, {
                    id: 'filename',
                    type: 'text',
                    css: 'uk-form-width-medium',
                    label: `${i18n._(t`Filename`)}:`,
                    helpText: i18n._(t`Latin characters, numbers, _, - (length: 0-64)`)
                }],
                this.props.appDataRuntime.config.wysiwyg ? {
                    id: 'content',
                    type: 'ckeditor5',
                    css: 'uk-form-width-large',
                    label: `${i18n._(t`Content`)}:`,
                    CKEditorInstance: CKEditor,
                    EditorInstance: ClassicEditor,
                    languages: Object.keys(this.props.appDataRuntime.config.languages),
                    language: this.props.appData.language,
                    imageUploadURL: `${this.props.appDataRuntime.config.api.url}/api/pages/image/upload`,
                    imageUploadExtras: {
                        token: this.props.appDataRuntime.token
                    }
                } : {
                        id: 'content',
                        type: 'ace',
                        css: 'uk-form-width-large',
                        label: `${i18n._(t`Content`)}:`,
                        imageUploadURL: `${this.props.appDataRuntime.config.api.url}/api/pages/image/upload`,
                        imageUploadExtras: {
                            token: this.props.appDataRuntime.token
                        },
                        imageUploadLabel: t`Upload image`,
                        imageUploadErrorLabel: t`Could not upload an image`
                    },
                {
                    id: 'template',
                    type: 'select',
                    label: `${i18n._(t`Template`)}:`,
                    css: 'uk-form-width-small',
                    defaultValue: templates.available[0],
                    updateFromProps: true,
                    values: this.getTemplatesObject()
                },
                {
                    id: 'extras',
                    type: 'checkbox',
                    label: `${i18n._(t`Extras`)}:`,
                    values: {
                        minify: i18n._(t`Minifiy the HTML code displayed to the user`),
                        typo: i18n._(t`Apply typography transformation on displayed content`)
                    },
                    defaultValue: { minify: true, typo: true }
                },
                {
                    id: 'divider1',
                    type: 'divider'
                },
                [
                    {
                        id: 'btnCancel',
                        type: 'button',
                        buttonType: 'link',
                        linkTo: '/admin/pages',
                        css: 'uk-button-default uk-margin-small-right',
                        label: i18n._(t`Cancel`)
                    }, {
                        id: 'btnSave',
                        type: 'button',
                        buttonType: 'submit',
                        css: 'uk-button-primary',
                        label: i18n._(t`Save`)
                    }
                ]
            ]
        }
        validation={
            {
                title: {
                    mandatory: true,
                    maxLength: 128
                },
                path: {
                    mandatory: true,
                    regexp: /^[a-z0-9_\-//]+$/i,
                    maxLength: 128
                },
                filename: {
                    regexp: /^[a-z0-9_-]+$/i,
                    maxLength: 64
                }
            }
        }
        lang={{
            ERR_VMANDATORY: t`Field is required`,
            ERR_VFORMAT: t`Invalid format`,
            ERR_VNOMATCH: t`Passwords do not match`,
            ERR_LOAD: t`Could not load data from server`,
            ERR_SAVE: t`Could not save data`,
            WILL_BE_DELETED: t`will be deleted. Are you sure?`,
            YES: t`Yes`,
            CANCEL: t`Cancel`,
        }}
        save={{
            url: `${this.props.appDataRuntime.config.api.url}/api/pages/save`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        }}
        load={this.props.match.params.id ? {
            url: `${this.props.appDataRuntime.config.api.url}/api/pages/load`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        } : null}
        onSaveSuccess={res => this.onSaveSuccessHandler(res, i18n)}
        onLoadError={() => this.setState({ loadingError: true })}
        onLoadSuccess={() => this.setState({ loadingError: false })}
    />);

    reloadEditFormData = e => {
        e.preventDefault();
        this.setState({ loadingError: false });
    }

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(this.props.match.params.id ? 'Edit Page' : 'New Page'), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{this.props.match.params.id ? <Trans>Edit Page</Trans> : <Trans>New Page</Trans>}</div>
                        {this.props.appDataRuntime.config.demo ? <div className="uk-alert-warning" uk-alert="true"><Trans>This website is currently running in demo mode. Your changes to the <strong>admin</strong> user account, root page, navigation etc. won&apos;t be actually saved to the database, and you won&apos;t get any errors because of that. File or image uploads are disabled, too.</Trans></div> : null}
                        {this.state.loadingError ? <div className="uk-alert-danger" uk-alert="true">
                            <Trans>Could not load data from server. Please check your URL or try to <a href="" onClick={this.reloadEditFormData}>reload</a> data.</Trans>
                        </div> : this.getEditForm(i18n)}
                        <DialogFolder
                            ref={this.dialogFolder}
                            i18n={i18n}
                            onSaveButtonClickHandler={folders => this.onSaveFolderHandler(i18n, folders)}
                        />
                    </>);
                }}
            </I18n>
        </AdminPanel>
    );
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime,
    appLingui: store.appLingui
}),
    dispatch => ({
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle))
    }))(PagesEdit);
