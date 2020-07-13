/* eslint-disable react/prop-types */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import appDataRuntimeLogout from '../../../../shared/redux/actions/appDataRuntimeLogout';

class UserLogout extends Component {
    componentDidMount = () => {
        this.props.appDataRuntimeLogoutAction(this.props.appDataRuntime.token, this.props.appDataRuntime.config);
    }

    render = () => (<></>)
}

export default connect(store => ({
    appDataRuntime: store.appDataRuntime,
}),
    dispatch => ({
        appDataRuntimeLogoutAction: (token, config) => dispatch(appDataRuntimeLogout(token, config))
    }))(UserLogout);
