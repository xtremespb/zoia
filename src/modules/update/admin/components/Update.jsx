/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */

import React, { lazy, Component } from 'react';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import { connect } from 'react-redux';
import axios from 'axios';
import UIkit from 'uikit';
import appLinguiSetCatalog from '../../../../shared/redux/actions/appLinguiSetCatalog';
import appDataRuntimeSetDocumentTitle from '../../../../shared/redux/actions/appDataRuntimeSetDocumentTitle';
import appDataRuntimeSetToken from '../../../../shared/redux/actions/appDataRuntimeSetToken';
import appDataSetUser from '../../../../shared/redux/actions/appDataSetUser';
import updateVersionData from '../actions/updateVersionData';

const AdminPanel = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "AdminPanel" */'../../../../shared/react/AdminPanel/AdminPanel.jsx'));

class Update extends Component {
    // constructor(props) {
    //     super(props);
    // }

    state = {
        versionLoading: false,
        error: false,
        updateStep: 1,
        updateStatus: ''
    }

    getVersionInfo = () => {
        this.setState({
            versionLoading: true
        });
        axios.post(`${this.props.appDataRuntime.config.api.url}/api/update/version`, {
            token: this.props.appDataRuntime.token,
        }, { headers: { 'content-type': 'application/json' } }).then(res => {
            this.setState({
                versionLoading: false
            });
            if (res && res.data && res.data.local && res.data.remote) {
                this.props.updateVersionDataAction(res.data.local, res.data.remote);
            }
        }).catch(() => {
            this.setState({
                versionLoading: false,
                error: true
            });
        });
    }

    componentDidMount = () => {
        this.getVersionInfo();
    }

    onUpdateButtonClick = e => {
        e.preventDefault();
        this.setState({
            updateStep: 2
        });
    }

    onUpdateConfirmButtonClick = async (e, i18n) => {
        e.preventDefault();
        this.setState({
            updateStep: 3,
            updateStatus: i18n._(t`Starting update process`)
        });
        const status = await this.startUpdateProcess();
        switch (status) {
            default:
                this.setState({
                    updateStep: 4,
                    updateStatus: i18n._(t`Could not start update process (Internal Server Error)`)
                });
                break;
        }
    }

    startUpdateProcess = async () => {
        try {
            const res = await axios.post(`${this.props.appDataRuntime.config.api.url}/api/update/start`, {
                token: this.props.appDataRuntime.token,
            }, { headers: { 'content-type': 'application/json' } });
            if (!res || !res.data || !res.data.statusCode) {
                return -1;
            }
        } catch (e) {
            return -1;
        }
        return -1;
    }

    render = () => (
        <AdminPanel>
            <I18n>
                {({ i18n }) => {
                    this.props.appDataRuntimeSetDocumentTitleAction(i18n._(t`update`), this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                    return (<>
                        <div className="uk-title-head uk-margin-bottom">{i18n._(t`update`)}</div>
                        {this.state.error ? <div className="uk-alert-danger" uk-alert="true">
                            <p>{i18n._(t`Could not fetch version information from API server`)}</p>
                        </div> : null}
                        {this.state.versionLoading ? <div><div uk-spinner="ratio:0.8" />&nbsp;{i18n._(t`Loading version data`)}…</div> : (<div>
                            <div>{i18n._(t`Local Version`)}: {this.props.versionData.versionLocal || i18n._(t`unknown`)}</div>
                            <div>{i18n._(t`Remote Version`)}: {this.props.versionData.versionRemote || i18n._(t`unknown`)}</div>
                        </div>)}
                        {this.props.versionData.versionLocal !== this.props.versionData.versionRemote && this.state.updateStep === 1 ? (<div className="uk-margin-top">
                            <button className="uk-button uk-button-primary" type="button" onClick={e => this.onUpdateButtonClick(e)}>{i18n._(t`Update`)}</button>
                        </div>) : null}
                        {this.props.versionData.versionLocal === this.props.versionData.versionRemote ? <div className="uk-margin-top uk-text-success">{i18n._(t`Your system is up to date.`)}</div> : null}
                        {this.state.updateStep === 2 ? (<div className="uk-margin-top">
                            <div className="uk-text-danger">{i18n._(t`Warning: your website may not work if update process goes wrong. Please ensure you've got access to your server for a manual restart.`)}</div>
                            <button className="uk-button uk-button-primary uk-margin-top" type="button" onClick={e => this.onUpdateConfirmButtonClick(e, i18n)}>{i18n._(t`Confirm Update`)}</button>
                        </div>) : null}
                        {this.state.updateStep === 3 ? (<div className="uk-margin-top">
                            <div><div uk-spinner="ratio:0.8" />&nbsp;{this.state.updateStatus}…</div>
                        </div>) : null}
                        {this.state.updateStep === 4 ? <div className="uk-alert-danger" uk-alert="true">
                            <p>{this.state.updateStatus}</p>
                        </div> : null}
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
    usersList: store.usersList,
    versionData: store.versionData
}),
    dispatch => ({
        appDataSetUserAction: user => dispatch(appDataSetUser(user)),
        appDataRuntimeSetTokenAction: token => dispatch(appDataRuntimeSetToken(token)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle)),
        updateVersionDataAction: (versionLocal, versionRemote) => dispatch(updateVersionData(versionLocal, versionRemote)),
    }))(Update);
