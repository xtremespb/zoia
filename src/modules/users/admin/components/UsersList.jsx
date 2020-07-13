/* eslint-disable react/prop-types */

import React, { lazy, Component } from 'react';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import axios from 'axios';
import cookies from 'zoia-cookies';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { history } from '../../../../shared/redux/store/configureStore';
import UIkit from '../../../../shared/lib/uikit';

import appDataRuntimeSetToken from '../../../../shared/redux/actions/appDataRuntimeSetToken';
import appLinguiSetCatalog from '../../../../shared/redux/actions/appLinguiSetCatalog';
import appDataSetUser from '../../../../shared/redux/actions/appDataSetUser';
import usersListTableSetState from '../actions/usersListTableSetState';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));
const Table = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "Table" */ '../../../../shared/react/Table/index.jsx'));
const DialogDelete = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "UsersDialogDelete" */ './DialogDelete.jsx'));

class UserList extends Component {
    constructor(props) {
        super(props);
        this.usersListTable = React.createRef();
        this.dialogDelete = React.createRef();
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/admin/users/auth?redirect=/admin/users');
        } else {
            const query = queryString.parse(window.location.search);
            if (query.reload && this.usersListTable.current) {
                this.usersListTable.current.reloadURL();
            }
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        cookies.expire(`${this.props.appDataRuntime.config.id}_auth`, undefined, this.props.appDataRuntime.config.cookieOptions);
        history.push(`/admin/users/auth?redirect=/admin/users`);
    }

    onUsersTableLoadError = res => {
        if (res && res.status === 401) {
            this.deauthorize();
            this.props.usersListTableSetStateAction({});
        }
    }

    onUsersTableSaveError = (data, i18n) => {
        if (data) {
            if (data.statusCode === 401) {
                this.deauthorize();
            }
            switch (data.errorCode) {
                case 1:
                    UIkit.notification(i18n._(t`Record with the entered value already exists`), { status: 'danger' });
                    break;
                case 2:
                    UIkit.notification(i18n._(t`Invalid format`), { status: 'danger' });
                    break;
                default:
                    UIkit.notification(i18n._(t`Could not save data`), { status: 'danger' });
            }
        } else {
            UIkit.notification(i18n._(t`Could not save data`), { status: 'danger' });
        }
    }

    onTableStateUpdated = state => this.props.usersListTableSetStateAction(state);

    onDeleteRecord = (id, e) => {
        if (e) {
            e.preventDefault();
        }
        const ids = [];
        const users = [];
        if (id && e) {
            ids.push(id);
            const data = this.usersListTable.current.getCurrentData();
            users.push(data.username[id]);
        } else {
            const data = this.usersListTable.current.getCheckboxData();
            data.map(i => {
                ids.push(i._id);
                users.push(i.username);
            });
        }
        if (ids.length) {
            this.dialogDelete.current.show(users, ids);
        }
    }

    onDeleteButtonClick = (ids, i18n) => {
        this.dialogDelete.current.hide();
        this.usersListTable.current.setLoading(true);
        axios.post(`${this.props.appDataRuntime.config.api.url}/api/users/delete`, {
            token: this.props.appDataRuntime.token,
            ids
        }, { headers: { 'content-type': 'application/json' } }).then(res => {
            this.usersListTable.current.setLoading(false);
            if (res.data.statusCode !== 200) {
                return UIkit.notification(i18n._(t`Cannot delete one or more users`), { status: 'danger' });
            }
            this.usersListTable.current.reloadURL();
            return UIkit.notification(i18n._(t`Operation complete`), { status: 'success' });
        }).catch(() => this.usersListTable.current.setLoading(false) && UIkit.notification(i18n._(t`Cannot delete one or more users`), { status: 'danger' }));
    }

    onRefreshTable = e => {
        e.preventDefault();
        if (this.usersListTable.current) {
            this.usersListTable.current.reloadURL();
        }
    }

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(t`Users`), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{i18n._(t`Users`)}</div>
                        <Table
                            prefix="usersListTable"
                            ref={this.usersListTable}
                            initialState={this.props.usersList.usersTableState}
                            onStateUpdated={this.onTableStateUpdated}
                            i18n={i18n}
                            UIkit={UIkit}
                            axios={axios}
                            topButtons={<><Link to="/admin/users/add" className="uk-icon-button uk-button-primary uk-margin-small-right" uk-icon="plus" uk-tooltip={i18n._(t`Create new user`)} /><button type="button" className="uk-icon-button uk-button-danger uk-margin-right" uk-icon="trash" uk-tooltip={i18n._(t`Delete selected users`)} onClick={e => this.onDeleteRecord(null, e)} /><button type="button" className="uk-icon-button uk-button-default" uk-icon="refresh" uk-tooltip={i18n._(t`Refresh`)} onClick={this.onRefreshTable} /></>}
                            columns={[{
                                id: 'username',
                                title: 'Username',
                                sortable: true,
                                editable: 'text',
                                cssHeader: 'uk-width-1-6@m uk-text-nowrap',
                                validation: {
                                    mandatory: true,
                                    regexp: '^[A-Za-z0-9_-]{4,32}$'
                                }
                            }, {
                                id: 'email',
                                title: 'E-mail',
                                sortable: true,
                                process: item => item || '',
                                editable: 'text',
                                validation: {
                                    mandatory: true,
                                    regexp: '^(?:[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$'
                                }
                            }, {
                                id: 'active',
                                title: 'Status',
                                cssRow: 'uk-width-small uk-text-nowrap ztable-noselect',
                                sortable: true,
                                process: item => item ? 1 : 0,
                                editable: 'select',
                                options: {
                                    0: 'Inactive',
                                    1: 'Active'
                                }
                            }, {
                                id: 'actions',
                                title: 'Actions',
                                cssRow: 'uk-table-shrink uk-text-nowrap ztable-noselect',
                                process: (val, row) => (<><Link to={`/admin/users/edit/${row._id}`} className="uk-icon-button" uk-icon="pencil" uk-tooltip={`title: ${i18n._(t`Edit`)}`} />&nbsp;<a href="" className="uk-icon-button" uk-icon="trash" uk-tooltip={`title: ${i18n._(t`Delete`)}`} onClick={e => this.onDeleteRecord(row._id, e)} /></>)
                            }]}
                            itemsPerPage={this.props.appDataRuntime.config.commonItemsLimit || 10}
                            source={{
                                url: `${this.props.appDataRuntime.config.api.url}/api/users/list`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token
                                }
                            }}
                            save={{
                                url: `${this.props.appDataRuntime.config.api.url}/api/users/save/field`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token
                                }
                            }}
                            sortColumn="username"
                            sortDirection="asc"
                            lang={{
                                LOADING: i18n._(t`Loading data, please wait…`),
                                NO_RECORDS: i18n._(t`No records to display`),
                                ERROR_LOAD: i18n._(t`Could not load data`),
                                ERROR_SAVE: i18n._(t`Could not save data`),
                                ERR_VMANDATORY: i18n._(t`Field is required`),
                                ERR_VFORMAT: i18n._(t`Invalid format`)
                            }}
                            onLoadError={this.onUsersTableLoadError}
                            onSaveError={data => this.onUsersTableSaveError(data, i18n)}
                        />
                        <DialogDelete
                            ref={this.dialogDelete}
                            i18n={i18n}
                            onDeleteButtonClickHandler={ids => this.onDeleteButtonClick(ids, i18n)}
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
    appLingui: store.appLingui,
    usersList: store.usersList
}),
    dispatch => ({
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        usersListTableSetStateAction: state => dispatch(usersListTableSetState(state)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle))
    }))(UserList);
