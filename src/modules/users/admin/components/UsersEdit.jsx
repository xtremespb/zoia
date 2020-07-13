/* eslint-disable react/prop-types */

import React, { lazy, Component } from 'react';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import cookies from 'zoia-cookies';
import axios from 'axios';
import { Trans, t } from '@lingui/macro';
import { history } from '../../../../shared/redux/store/configureStore';
import appDataRuntimeSetToken from '../../../../shared/redux/actions/appDataRuntimeSetToken';
import appDataSetUser from '../../../../shared/redux/actions/appDataSetUser';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';
import UIkit from '../../../../shared/lib/uikit';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));
const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../shared/react/FormBuilder/index.jsx'));

class UsersEdit extends Component {
    constructor(props) {
        super(props);
        this.editUserForm = React.createRef();
    }

    state = {
        loadingError: false
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/admin/users/auth?redirect=/admin/users');
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        // removeCookie(`${site.id}_auth`);
        cookies.expire(`${this.props.appDataRuntime.config.id}_auth`, undefined, this.props.appDataRuntime.config.cookieOptions);
        history.push(`/admin/users/auth?redirect=/admin/users`);
    }

    onUsersTableLoadError = data => {
        if (data && data.statusCode === 401) {
            this.deauthorize();
        }
    }

    onSaveSuccessHandler = i18n => {
        UIkit.notification({
            message: i18n._(t`Data has been saved successfully`),
            status: 'success'
        });
        history.push('/admin/users?reload=1');
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editUserForm}
        prefix="editUserForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        data={
            [
                [
                    {
                        id: 'username',
                        type: 'text',
                        css: 'uk-form-width-medium',
                        label: i18n._(t`Username`),
                        helpText: i18n._(t`Latin chars/_/-, length: 4-32`),
                        autofocus: true
                    },
                    {
                        id: 'email',
                        type: 'text',
                        css: 'uk-form-width-large',
                        label: i18n._(t`E-mail`),
                        helpText: i18n._(t`Example: username@zoiajs.org`)
                    },
                    {
                        id: 'active',
                        type: 'select',
                        label: i18n._(t`Status`),
                        css: 'uk-form-width-small',
                        defaultValue: '1',
                        updateFromProps: true,
                        values: {
                            0: i18n._(t`Inactive`),
                            1: i18n._(t`Active`)
                        }
                    },
                    {
                        id: 'admin',
                        type: 'select',
                        label: i18n._(t`Permissions`),
                        css: 'uk-form-width-small',
                        updateFromProps: true,
                        values: {
                            0: i18n._(t`Normal User`),
                            1: i18n._(t`Administrator`)
                        }
                    }
                ],
                [{
                    id: 'password',
                    type: 'password',
                    css: 'uk-width-small',
                    label: i18n._(t`Password`),
                },
                {
                    id: 'password2',
                    type: 'password',
                    css: 'uk-width-small',
                    label: i18n._(t`Repeat Password`),
                }],
                {
                    id: 'passwordMessage',
                    type: 'message',
                    css: 'uk-text-small',
                    text: this.props.match.params.id ? i18n._(t`Only enter a new password in case you wish to change it for the current user. Password should be at least 8 characters long.`) : i18n._(t`Password is required when creating a new user, should be at least 8 characters long.`)
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
                        linkTo: '/admin/users',
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
                username: {
                    mandatory: true,
                    regexp: /^[a-zA-Z0-9_-]{4,32}$/
                },
                email: {
                    mandatory: true,
                    // eslint-disable-next-line no-control-regex
                    regexp: /^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/
                },
                password: {
                    shouldMatch: 'password2'
                },
                password2: {
                    shouldMatch: 'password'
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
            CANCEL: t`Cancel`
        }}
        save={{
            url: `${this.props.appDataRuntime.config.api.url}/api/users/save`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        }}
        load={this.props.match.params.id ? {
            url: `${this.props.appDataRuntime.config.api.url}/api/users/load`,
            method: 'POST',
            extras: {
                id: this.props.match.params.id,
                token: this.props.appDataRuntime.token
            }
        } : null}
        onSaveSuccess={() => this.onSaveSuccessHandler(i18n)}
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
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(this.props.match.params.id ? 'Edit User' : 'Create User'), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{this.props.match.params.id ? <Trans>Edit User</Trans> : <Trans>Create User</Trans>}</div>
                        {this.props.appDataRuntime.config.demo ? <div className="uk-alert-warning" uk-alert="true"><Trans>This website is currently running in demo mode. Your changes to the <strong>admin</strong> user account, root page, navigation etc. won&apos;t be actually saved to the database, and you won&apos;t get any errors because of that. File or image uploads are disabled, too.</Trans></div> : null}
                        {this.state.loadingError ? <div className="uk-alert-danger" uk-alert="true">
                            <Trans>Could not load data from server. Please check your URL or try to <a href="" onClick={this.reloadEditFormData}>reload</a> data.</Trans>
                        </div> : this.getEditForm(i18n)}
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
    }))(UsersEdit);
