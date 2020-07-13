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
import pagesListTableSetState from '../actions/pagesListTableSetState';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));
const Table = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "Table" */ '../../../../shared/react/Table/index.jsx'));
const DialogDelete = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "PagesDialogDelete" */ './DialogDelete.jsx'));

class PagesList extends Component {
    constructor(props) {
        super(props);
        this.pagesListTable = React.createRef();
        this.dialogDelete = React.createRef();
    }

    componentDidMount = () => {
        if (!this.props.appDataRuntime.token) {
            history.push('/admin/users/auth?redirect=/admin/pages');
        } else {
            const query = queryString.parse(window.location.search);
            if (query.reload && this.pagesListTable.current) {
                this.pagesListTable.current.reloadURL();
            }
        }
    }

    deauthorize = () => {
        this.props.appDataRuntimeSetTokenAction(null);
        this.props.appDataSetUserAction({});
        cookies.expire(`${this.props.appDataRuntime.config.id}_auth`, undefined, this.props.appDataRuntime.config.cookieOptions);
        history.push(`/admin/users/auth?redirect=/admin/pages`);
    }

    onPagesTableLoadError = res => {
        if (res && res.status === 401) {
            this.deauthorize();
            this.props.pagesListTableSetStateAction({});
        }
    }

    onPagesTableSaveError = (data, i18n) => {
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

    onTableStateUpdated = state => this.props.pagesListTableSetStateAction(state);

    onDeleteRecord = (id, e) => {
        if (e) {
            e.preventDefault();
        }
        const ids = [];
        const pages = [];
        const pagesListTable = this.pagesListTable.current;
        if (id && e) {
            ids.push(id);
            const data = pagesListTable.getCurrentData();
            pages.push(`${data.title[id]} (${data.path[id]})`);
        } else {
            const data = pagesListTable.getCheckboxData();
            data.map(i => {
                ids.push(i._id);
                pages.push(`${i.title} (${i.path})`);
            });
        }
        if (ids.length) {
            this.dialogDelete.current.show(pages, ids);
        }
    }

    onDeleteButtonClick = (ids, i18n) => {
        this.dialogDelete.current.hide();
        this.pagesListTable.current.setLoading(true);
        axios.post(`${this.props.appDataRuntime.config.api.url}/api/pages/delete`, {
            token: this.props.appDataRuntime.token,
            ids
        }, { headers: { 'content-type': 'application/json' } }).then(res => {
            this.pagesListTable.current.setLoading(false);
            if (res.data.statusCode !== 200) {
                return UIkit.notification(i18n._(t`Cannot delete one or more pages`), { status: 'danger' });
            }
            this.pagesListTable.current.reloadURL();
            return UIkit.notification(i18n._(t`Operation complete`), { status: 'success' });
        }).catch(() => this.pagesListTable.current.setLoading(false) && UIkit.notification(i18n._(t`Cannot delete one or more pages`), { status: 'danger' }));
    }

    processActions = (val, row, i18n) => (<>
        <Link to={`/admin/pages/edit/${row._id}`} className="uk-icon-button" uk-icon="pencil" uk-tooltip={`title: ${i18n._(t`Edit`)}`} />
        &nbsp;
        <a href="" className="uk-icon-button" uk-icon="trash" uk-tooltip={`title: ${i18n._(t`Delete`)}`} onClick={e => this.onDeleteRecord(row._id, e)} />
    </>);

    onRefreshTable = e => {
        e.preventDefault();
        if (this.pagesListTable.current) {
            this.pagesListTable.current.reloadURL();
        }
    }

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(t`Pages`), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{i18n._(t`Pages`)}</div>
                        <Table
                            prefix="pagesListTable"
                            ref={this.pagesListTable}
                            initialState={this.props.pagesList.pagesTableState}
                            onStateUpdated={this.onTableStateUpdated}
                            i18n={i18n}
                            UIkit={UIkit}
                            axios={axios}
                            topButtons={<><Link to="/admin/pages/add" className="uk-icon-button uk-button-primary uk-margin-small-right" uk-icon="plus" uk-tooltip={i18n._(t`Create new page`)} /><button type="button" className="uk-icon-button uk-button-danger uk-margin-right" uk-icon="trash" uk-tooltip={i18n._(t`Delete selected pages`)} onClick={this.onDeleteRecord} /><button type="button" className="uk-icon-button uk-button-default" uk-icon="refresh" uk-tooltip={i18n._(t`Refresh`)} onClick={this.onRefreshTable} /></>}
                            columns={[{
                                id: 'title',
                                title: t`Page`,
                                sortable: true,
                                cssHeader: 'uk-text-nowrap uk-width-expand'
                            },
                            {
                                id: 'path',
                                title: t`Path`,
                                sortable: true,
                                cssHeader: 'uk-text-nowrap'
                            },
                            {
                                id: 'actions',
                                title: t`Actions`,
                                cssRow: 'uk-table-shrink uk-text-nowrap ztable-noselect',
                                process: (val, row) => this.processActions(val, row, i18n)
                            }]}
                            itemsPerPage={this.props.appDataRuntime.config.commonItemsLimit}
                            source={{
                                url: `${this.props.appDataRuntime.config.api.url}/api/pages/list`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token,
                                    language: this.props.appData.language
                                }
                            }}
                            save={{
                                url: `${this.props.appDataRuntime.config.api.url}/api/pages/saveField`,
                                method: 'POST',
                                extras: {
                                    token: this.props.appDataRuntime.token
                                }
                            }}
                            sortColumn="title"
                            sortDirection="asc"
                            lang={{
                                LOADING: i18n._(t`Loading data, please wait…`),
                                NO_RECORDS: i18n._(t`No records to display`),
                                ERROR_LOAD: i18n._(t`Could not load data`),
                                ERROR_SAVE: i18n._(t`Could not save data`),
                                ERR_VMANDATORY: i18n._(t`Field is required`),
                                ERR_VFORMAT: i18n._(t`Invalid format`)
                            }}
                            onLoadError={this.onPagesTableLoadError}
                            onSaveError={data => this.onPagesTableSaveError(data, i18n)}
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
    pagesList: store.pagesList
}),
    dispatch => ({
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        pagesListTableSetStateAction: state => dispatch(pagesListTableSetState(state)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle))
    }))(PagesList);
