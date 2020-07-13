/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */

import React, { lazy, Component } from 'react';
import { t, Trans } from '@lingui/macro';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import cloneDeep from 'lodash/cloneDeep';
import cookies from 'zoia-cookies';
import axios from 'axios';
import UIkit from '../../../../shared/lib/uikit';
import { history } from '../../../../shared/redux/store/configureStore';
import DialogNavEdit from './DialogNavEdit.jsx';
import appLinguiSetCatalog from '../../../../shared/redux/actions/appLinguiSetCatalog';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';
import appDataRuntimeSetToken from '../../../../shared/redux/actions/appDataRuntimeSetToken';
import appDataSetUser from '../../../../shared/redux/actions/appDataSetUser';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));
const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../shared/react/FormBuilder/index.jsx'));

class Nav extends Component {
    constructor(props) {
        super(props);
        this.editNavForm = React.createRef();
        this.dialogNavEdit = React.createRef();
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/admin/users/auth?redirect=/admin/nav');
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        cookies.expire(`${this.props.appDataRuntime.config.id}_auth`, undefined, this.props.appDataRuntime.config.cookieOptions);
        history.push(`/admin/users/auth?redirect=/admin/nav`);
    }

    loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item.key === key) {
                callback(item, index, arr);
            } else if (item.children) {
                this.loop(item.children, key, callback);
            }
        });
    }

    loopFilter = (data, key) => data.filter(item => {
        if (item.children) {
            item.children = this.loopFilter(item.children, key);
        }
        return item.key !== key;
    });

    loopEach = (data, callback) => {
        data.forEach((item, index, arr) => {
            callback(item, index, arr);
            if (item.children) {
                this.loopEach(item.children, callback);
            }
        });
    }

    onAddTreeItemButtonClick = e => {
        e.preventDefault();
        this.dialogNavEdit.current.show();
    }

    onEditTreeItemButtonClick = e => {
        e.preventDefault();
        const folders = this.editNavForm.current.getValue('nav');
        if (!folders || !folders.tree || !Object.keys(folders.tree).length) {
            return;
        }
        let item;
        this.loop(folders.tree, folders.selected[0], i => item = i);
        if (item) {
            this.dialogNavEdit.current.show(item);
        }
    }

    onDeleteTreeItemButtonClick = async e => {
        e.preventDefault();
        const folders = this.editNavForm.current.getValue('nav');
        if (!folders || !folders.tree || !Object.keys(folders.tree).length) {
            return;
        }
        (folders.selected && folders.selected.length ? folders.selected || [] : folders.checked.checked || []).map(key => folders.tree = this.loopFilter(folders.tree, key));
        folders.checked = [];
        folders.selected = [];
        await this.editNavForm.current.setValue('nav', []);
        await this.editNavForm.current.setValue('nav', folders);
    }

    onSaveFolderClickHandler = async data => {
        const folders = this.editNavForm.current.getValue('nav') || {
            tree: [],
            checked: [],
            selected: []
        };
        let item;
        this.loop(folders.tree, data.key, i => {
            item = i;
        });
        const tree = cloneDeep(data);
        delete tree.key;
        delete tree.url;
        const dataTree = {
            data: tree,
            url: data.url,
            key: data.key
        };
        if (item) {
            this.loop(folders.tree, data.key, i => {
                i.data = dataTree.data;
                i.url = dataTree.url;
                if (typeof i.children === 'undefined') {
                    delete i.children;
                }
            });
        } else if (folders.selected.length) {
            let selected;
            this.loop(folders.tree, folders.selected[0], i => {
                selected = i;
            });
            selected.children = selected.children || [];
            selected.children.push(dataTree);
        } else {
            folders.tree.push(dataTree);
        }
        if (folders.expanded && folders.expanded.indexOf(data.key) === -1) {
            folders.expanded.push(data.key);
        }
        this.loopEach(folders.tree, i => {
            const defaultTitle = i.data[Object.keys(this.props.appDataRuntime.config.languages)[0]] ? i.data[Object.keys(this.props.appDataRuntime.config.languages)[0]].title : '';
            const title = i.data[this.props.appData.language] ? i.data[this.props.appData.language].title : defaultTitle;
            i.title = title;
        });
        await this.editNavForm.current.setValue('nav', []);
        await this.editNavForm.current.setValue('nav', folders);
    }

    onSaveSuccessHandler = (res, i18n) => {
        if (res && res.data && res.data.statusCode === 200) {
            UIkit.notification({
                message: i18n._(t`Data has been saved successfully`),
                status: 'success'
            });
        } else {
            UIkit.notification({
                message: i18n._(t`Could not save data`),
                status: 'danger'
            });
        }
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editNavForm}
        prefix="editNavForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        data={
            [
                {
                    id: 'help',
                    type: 'message',
                    css: 'uk-margin-top uk-text-small',
                    text: i18n._(t`Navigation will be displayed in a template of your website.`)
                },
                {
                    id: 'nav',
                    type: 'tree',
                    draggable: true,
                    checkable: true,
                    selectable: true,
                    addItemButtonLabel: i18n._(t`Add`),
                    editItemButtonLabel: i18n._(t`Edit`),
                    deleteItemButtonLabel: i18n._(t`Delete`),
                    noItemsLabel: i18n._(t`No records to display`),
                    onAddItemButtonClick: e => this.onAddTreeItemButtonClick(e),
                    onEditItemButtonClick: e => this.onEditTreeItemButtonClick(e),
                    onDeleteItemButtonClick: e => this.onDeleteTreeItemButtonClick(e),
                },
                {
                    id: 'divider1',
                    type: 'divider'
                },
                [
                    {
                        id: 'btnSave',
                        type: 'button',
                        buttonType: 'submit',
                        css: 'uk-button-primary',
                        label: i18n._(t`Save`)
                    }
                ]
            ]
        }
        save={{
            url: `${this.props.appDataRuntime.config.api.url}/api/nav/save`,
            method: 'POST',
            extras: {
                language: this.props.appData.language,
                token: this.props.appDataRuntime.token
            }
        }}
        load={{
            url: `${this.props.appDataRuntime.config.api.url}/api/nav/load`,
            method: 'POST',
            extras: {
                language: this.props.appData.language,
                token: this.props.appDataRuntime.token
            }
        }}
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
        onSaveSuccess={res => this.onSaveSuccessHandler(res, i18n)}
        onLoadError={res => {
            if (res && res.data && res.data.statusCode === 401) {
                this.deauthorize();
            } else {
                UIkit.notification({
                    message: i18n._(t`Could not load data from server`),
                    status: 'danger'
                });
            }
        }}
    />);

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(t`Navigation`), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <DialogNavEdit
                            i18n={i18n}
                            ref={this.dialogNavEdit}
                            onSaveButtonClickHandler={this.onSaveFolderClickHandler}
                        />
                        <div className="uk-title-head uk-margin-bottom">{i18n._(t`Navigation`)}</div>
                        {this.props.appDataRuntime.config.demo ? <div className="uk-alert-warning" uk-alert="true"><Trans>This website is currently running in demo mode. Your changes to the <strong>admin</strong> user account, root page, navigation etc. won&apos;t be actually saved to the database, and you won&apos;t get any errors because of that. File or image uploads are disabled, too.</Trans></div> : null}
                        <div className="uk-margin-top">{this.getEditForm(i18n)}</div>
                    </>);
                }}
            </I18n>
        </AdminPanel>
    );
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime,
    appLingui: store.appLingui,
    usersList: store.usersList
}),
    dispatch => ({
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle))
    }))(Nav);
