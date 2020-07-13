/* eslint-disable react/prop-types, no-console */
import React, { Component } from 'react';

import Error from './Error.jsx';

export default class ErrorBoundary extends Component {
    state = {
        error: false
    }

    static getDerivedStateFromError = error => {
        console.error(error);
        return { error: true };
    }

    render = () => (this.state.error ? <Error /> : this.props.children);
}
