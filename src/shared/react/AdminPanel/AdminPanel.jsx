/* eslint-disable react/prop-types */

import React, { Component } from 'react';
import { I18nProvider, I18n } from '@lingui/react';
import { Trans } from '@lingui/macro';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import appDataSetLanguage from '../../redux/actions/appDataSetLanguage';
import appLinguiSetCatalog from '../../redux/actions/appLinguiSetCatalog';
import UIkit from '../../lib/uikit';
import modulesData from '../../build/modules.json';

import './AdminPanel.css';
import '../../styles/flags.css';

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
        this.props.appLinguiSetCatalogAction(language, catalog);
        this.setState(state => {
            const catalogs = {
                ...state.catalogs,
                [language]: catalog
            };
            return {
                language,
                catalogs
            };
        });
    }

    resizeNav = () => document.getElementById('za_admin_nav_wrap') ? document.getElementById('za_admin_nav_wrap').style.height = `${window.innerHeight - 64}px` : null;

    componentDidMount = () => {
        window.onresize = this.resizeNav;
        this.resizeNav();
    }

    componentWillUnmount = () => {
        UIkit.offcanvas('#offcanvas-nav').$destroy(true);
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { catalogs, language } = nextState;
        if (language !== this.props.appData.language && !catalogs[language]) {
            this.loadCatalog(language);
            return false;
        }
        return true;
    }

    getModulesList = prefix => (
        <I18n>
            {({ i18n }) => (Object.keys(modulesData).map(id => modulesData[id].admin ? (<li key={`${prefix}_${id}`}><Link to={modulesData[id].adminRoute}><span uk-icon={`icon:${modulesData[id].icon};ratio:0.95`} />&nbsp;&nbsp;{i18n._(id)}</Link></li>) : null))}
        </I18n>
    );

    onLanguageClick = e => {
        e.preventDefault();
        this.setState({
            language: e.currentTarget.dataset.lang
        });
        this.props.appDataSetLanguageAction(e.currentTarget.dataset.lang);
        // A hack to hide dropdown faster
        // UIkit's "hide" is a way too slow (bug?)
        UIkit.dropdown('#za_dropdown_lang').hide();
        document.getElementById('za-dummy-btn').click();
    }

    getLanguagesList = prefix => Object.keys(this.props.appDataRuntime.config.languages).map(lang => (<li key={`${prefix}_${lang}`}><a href="#" data-lang={lang} onClick={this.onLanguageClick}><span className={`flag-icon flag-icon-${lang}`} />&nbsp;&nbsp;{this.props.appDataRuntime.config.languages[lang]}</a></li>));

    render = () => {
        const { catalogs, language } = this.state;
        if (!catalogs || !catalogs[language]) {
            return null;
        }
        return (<I18nProvider language={this.props.appData.language} catalogs={this.state.catalogs}>            
            <div>
                <nav className="uk-navbar-container za-admin-navbar uk-dark" uk-navbar="true" uk-sticky="true">
                    <div className="uk-navbar-left za-admin-navbar-left">
                        <div className="uk-navbar-item uk-logo">
                            <span className="uk-hidden@m uk-margin-small-right">
                                <a href="" className="uk-icon-link" uk-icon="icon:menu;ratio:1.5" uk-toggle="target: #offcanvas-nav" />
                                &nbsp;
                            </span>
                            <Link to="/admin">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="80" height="26"><path d="M35 22.4H21.7v-.8l12-17.2H22.4v-.9h12.5v.9l-12 17.1H35v.9zM54.5 13c0 5.7-3.4 9.8-8.7 9.8s-8.7-4.2-8.7-9.8c0-5.7 3.4-9.8 8.7-9.8 5.3-.1 8.7 4.1 8.7 9.8zm-1.2 0c0-5.7-3.4-8.9-7.5-8.9-4.2 0-7.5 3.2-7.5 8.9s3.4 8.9 7.5 8.9 7.5-3.3 7.5-8.9zm4.9 9.4V3.5h1v18.9h-1zm8.8-7.2l-2.7 7.2h-1.1l7.2-18.9h1.4L79 22.4h-1.1l-2.7-7.2H67zm7.8-.9l-3.7-9.9-3.7 9.9h7.4z" fill="#ededed" /><use xlinkHref="#E" fill="#fcd600" /><linearGradient id="A" gradientUnits="userSpaceOnUse" x1="1.841" y1="14.959" x2="14.094" y2="10.877"><stop offset="0" stopColor="#2c4267" /><stop offset=".099" stopColor="#43426f" stopOpacity=".9" /><stop offset=".272" stopColor="#66427a" stopOpacity=".728" /><stop offset=".448" stopColor="#814383" stopOpacity=".552" /><stop offset=".626" stopColor="#94438a" stopOpacity=".374" /><stop offset=".808" stopColor="#9f438e" stopOpacity=".192" /><stop offset="1" stopColor="#a3438f" stopOpacity="0" /></linearGradient><use xlinkHref="#E" x="-0.3" fill="url(#A)" /><path d="M6.5 14.2c-3.9 1-3.8.1-3.8.1l-.9-1.5c-.4.5-.7 1.3-.2 2.1.8 1.3 2.4 1.2 2.7 1.2s4-.9 4-.9 2-1.5 3.8-2.4l-5.6 1.4z" opacity=".43" fill="#dc5480" /><path d="M13.5 0s3.2 3.6-3.1 8.3c-6.8 5-8.5 7.9-5.7 7.9 0 0-3.9 1-4.5-2.8-.4-2.2 1.1-3.5 2.9-5C3 8.4 9.3 3.9 13.5 0z" fill="#fdcd00" /><linearGradient id="B" gradientUnits="userSpaceOnUse" x1="10.932" y1="26.005" x2="8.766" y2="19.505"><stop offset="0" stopColor="#d4366b" /><stop offset=".5" stopColor="#ab3972" /><stop offset="1" stopColor="#ab3972" /></linearGradient><path d="M10.2 19s-2.1 3.6 1.8 6.5v.1c-.6-.2-1.6-.6-2.4-1.1-2.5-1.3-.6-4.1.6-5.5z" fill="url(#B)" /><path d="M10.2 19s-2.1 3.6 1.8 6.5v.1c-.6-.2-2.1-.8-2.7-1.3-2.1-1.9-.3-3.9.9-5.3z" fill="#dc5480" /><path d="M16.3 12.8c-.1-1.7-2.5-1.9-2.5-1.9 1.4.8-2.9 1.7-6.1 5.2-2.2 2.5-1.4 5.1-1.4 5.1.7 2.3 3.1 3.4 3.1 3.4-3.7-5.6 7.2-8.6 6.9-11.8z" fill="#686d6f" /><path d="M16.4 12.8c-.1-1.7-2.5-1.9-2.5-1.9 1.4.8-2.9 1.7-6.1 5.2-2.2 2.5-1.4 5.1-1.4 5.1.7 2.3 3.1 3.4 3.1 3.4-3.8-5.6 6.8-8.5 6.9-11.8z" fill="#73787b" /><path d="M13.4 0s.6 2.6-6.7 7.8C.9 11.9 0 15.1 2 16c.6.2 1.3.3 1.8.2.2 0 .5-.1.7-.1-2.8.1-1-2.9 5.7-7.9C16.6 3.6 13.4 0 13.4 0z" opacity=".25" fill="#fff" /><path d="M14.6 13.2c1.3-1 .6-1.7.6-1.8-.7-.4-1.3-.5-1.3-.5 1.4.8-2.9 1.7-6.1 5.2-2.2 2.5-1.4 5.1-1.4 5.1.7 2.3 3.1 3.4 3.1 3.4-7.1-4.2 3.7-10.4 5.1-11.4z" fill="#d2ac20" /><linearGradient id="C" gradientUnits="userSpaceOnUse" x1="6.504" y1="19.505" x2="17.573" y2="15.818"><stop offset="0" stopColor="#e13e81" stopOpacity="0" /><stop offset=".028" stopColor="#e55791" stopOpacity=".057" /><stop offset=".085" stopColor="#ec83ae" stopOpacity=".17" /><stop offset=".145" stopColor="#f2a9c7" stopOpacity=".29" /><stop offset=".206" stopColor="#f7c9db" stopOpacity=".412" /><stop offset=".27" stopColor="#fae1eb" stopOpacity=".54" /><stop offset=".337" stopColor="#fdf2f6" stopOpacity=".674" /><stop offset=".41" stopColor="#fefcfd" stopOpacity=".82" /><stop offset=".5" stopColor="#fff" /><stop offset=".568" stopColor="#fdfbfc" stopOpacity=".864" /><stop offset=".639" stopColor="#f8eef3" stopOpacity=".722" /><stop offset=".712" stopColor="#efd9e4" stopOpacity=".577" /><stop offset=".785" stopColor="#e3bccf" stopOpacity=".43" /><stop offset=".86" stopColor="#d396b4" stopOpacity=".28" /><stop offset=".934" stopColor="#bf6994" stopOpacity=".133" /><stop offset="1" stopColor="#ab3972" stopOpacity="0" /></linearGradient><path d="M14 10.9s.7.1 1.3.5c.1.1.7.9-.6 1.8-1.4 1-12.4 6.9-5.1 11.3-3.9-5.6 6.7-8.5 6.8-11.7 0-1.7-2.4-1.9-2.4-1.9z" opacity=".17" fill="url(#C)" /><defs><path id="E" d="M2.6 12.2s1.4.7 8-.9c1.5-.3 2.5-.6 3.4-.4 0 0 .8.9-1 1.6-1.8.8-4.4 2.7-4.4 2.7l-4 .9c-.3 0-1.9.2-2.7-1.2s.7-2.7.7-2.7z" /></defs></svg>                                
                            </Link>
                            <button id="za-dummy-btn" type="button" style={{ visibility: 'hidden' }} />
                        </div>
                    </div>
                    <div className="uk-navbar-right za-admin-navbar-right">
                        <ul className="uk-navbar-nav">
                            <li>
                                <a href="#">{this.props.appData.user.username}&nbsp;<span uk-icon="triangle-down" /></a>
                                <div className="uk-navbar-dropdown" uk-dropdown="mode:click;offset:-20;pos:top-right">
                                    <ul className="uk-nav uk-navbar-dropdown-nav">
                                        <li><Link to="/admin/users/logout"><Trans>Log Out</Trans></Link></li>
                                    </ul>
                                </div>
                            </li>
                            <li>
                                <a href="#"><span className={`flag-icon flag-icon-${this.props.appData.language} flag-icon-switch`} id="za-admin-languages-select" />&nbsp;&nbsp;</a>
                                <div className="uk-navbar-dropdown" id="za_dropdown_lang" uk-dropdown="mode:click;offset:-20;pos:top-right">
                                    <ul className="uk-nav uk-navbar-dropdown-nav">
                                        {this.getLanguagesList('desktop')}
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </nav>
                <div className="uk-grid-collapse uk-grid">
                    <div className="uk-width-small za-admin-navleft-column-wrap uk-visible@m">
                        <div>
                            <div id="za_admin_nav_wrap">
                                <div className="za-admin-navleft">
                                    <ul className="uk-nav uk-nav-default">
                                        {this.getModulesList('desktop')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="uk-width-expand">
                        <div className="za-admin-content-wrap">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div id="offcanvas-nav" uk-offcanvas="overlay:true">
                    <div className="uk-offcanvas-bar">
                        <ul className="uk-nav uk-nav-default">
                            {this.getModulesList('mobile')}
                        </ul>
                    </div>
                </div>
            </div>
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
    }))(AdminPanel);
