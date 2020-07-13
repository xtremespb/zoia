/* eslint-disable react/prop-types */

import React, { Component } from 'react';
import { I18nProvider, I18n } from '@lingui/react';
import { connect } from 'react-redux';
import { t } from '@lingui/macro';

import appDataSetLanguage from '../../redux/actions/appDataSetLanguage';
import appLinguiSetCatalog from '../../redux/actions/appLinguiSetCatalog';
import appDataRuntimeSetDocumentTitle from '../../redux/actions/appDataRuntimeSetDocumentTitle';

class AdminPanel extends Component {
    state = {
        language: this.props.appData.language,
        catalogs: this.props.appLingui.catalogs
    }

    constructor(props) {
        super(props);
        this.loadCatalog(this.state.language);
    }

    loadCatalog = async (language) => {
        const catalog = await import(/* webpackMode: "lazy", webpackChunkName: "i18n_admin_[index]" */`../../react/locales/admin/${language}/messages.js`);
        this.setState(state => {
            const catalogs = {
                ...state.catalogs,
                [language]: catalog
            };
            this.props.appLinguiSetCatalogAction(language, catalog);
            return {
                language,
                catalogs
            };
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { catalogs, language } = nextState;
        if (language !== this.props.appData.language && !catalogs[language]) {
            this.loadCatalog(language);
            return false;
        }
        return true;
    }

    render = () => {
        const { catalogs, language } = this.state;
        if (!catalogs || !catalogs[language]) {
            return null;
        }
        return (<I18nProvider language={this.props.appData.language} catalogs={this.state.catalogs}>
            <I18n>{({ i18n }) => {
                const errorMessage = i18n._(this.props.code === '404' ? t`Page not Found` : t`Internal Error`);
                this.props.appDataRuntimeSetDocumentTitleAction(errorMessage, this.props.appData.language, this.props.appDataRuntime.config.siteTitle);
                return (<div className="uk-flex uk-flex-center uk-flex-middle uk-flex-column" style={{ height: '100%' }}>
                    <div><svg height="128px" viewBox="0 0 512 512" width="128px" xmlns="http://www.w3.org/2000/svg"><path d="m0 96v384c0 17.679688 14.320312 32 32 32h448c17.679688 0 32-14.320312 32-32v-384zm0 0" fill="#e1eaf7" /><path d="m0 0h512v128h-512zm0 0" fill="#b0bec5" /><path d="m64 48h32v32h-32zm0 0" fill="#fff" /><path d="m128 48h32v32h-32zm0 0" fill="#fff" /><path d="m432 80h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" fill="#90a4ae" /><path d="m384 320c0 70.691406-57.308594 128-128 128s-128-57.308594-128-128 57.308594-128 128-128 128 57.308594 128 128zm0 0" fill="#e76e54" /><path d="m315.3125 283.3125-22.625-22.625-36.6875 36.6875-36.6875-36.6875-22.625 22.625 36.6875 36.6875-36.6875 36.6875 22.625 22.625 36.6875-36.6875 36.6875 36.6875 22.625-22.625-36.6875-36.6875zm0 0" /></svg></div>
                    <div className="uk-margin-top">
                        {errorMessage}
                    </div>
                </div>);
            }}</I18n>
        </I18nProvider>);
    };
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime,
    appLingui: store.appLingui
}),
    dispatch => ({
        appDataSetLanguageAction: language => dispatch(appDataSetLanguage(language)),
        appLinguiSetCatalogAction: (language, catalog) => dispatch(appLinguiSetCatalog(language, catalog)),
        appDataRuntimeSetDocumentTitleAction: (documentTitle, language, siteTitle) => dispatch(appDataRuntimeSetDocumentTitle(documentTitle, language, siteTitle)),
    }))(AdminPanel);
