/* eslint react/prop-types:0 */

import React, { Component } from 'react';
import debounce from 'lodash/debounce';

export default class ZSearch extends Component {
    state = {
        value: this.props.initialValue || ''
    }

    onValueChangedDebounced = debounce(value => this.props.onValueChanged(value), 500);

    onValueChanged = e => {
        const { value } = e.target;
        this.setState({
            value: value // eslint-disable-line object-shorthand
        });
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.onValueChangedDebounced(value) : null;
    }

    setValue = value => this.setState({ value });

    render() {
        return (<div className="uk-margin">
            <form className="uk-search uk-search-default" onSubmit={e => e.preventDefault()}>
                <span className="uk-form-icon uk-form-icon-flip" uk-icon="icon:search" />
                <input className="uk-search-input" type="search" value={this.state.value} onChange={e => this.onValueChanged(e)} />
            </form>
        </div>);
    }
}
