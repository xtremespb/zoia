/* eslint-disable react/prop-types */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { history } from '../../../../shared/redux/store/configureStore';
import modules from '../../../../shared/build/modules.json';

class AdminStub extends Component {
    componentDidMount = () => {
        history.push(modules.admin.adminRoute);
    }

    render = () => (<></>)
}

export default connect(() => ({}))(AdminStub);
