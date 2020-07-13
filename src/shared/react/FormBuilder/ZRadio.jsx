/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZRadio extends Component {
    focus = () => this.field.focus()

    getRadioButtons = () => Object.keys(this.props.values).map((key) => {
        const val = this.props.values[key];
        return (<label key={`${this.props.id}_radio_${key}`} className="zform-noselect uk-margin-small-right">
            <input
                className="uk-radio"
                type="radio"
                name={this.props.id}
                value={key}
                checked={this.props.value === key}
                onChange={e => this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, e.target.value) : null}
                disabled={this.props.disabled}
            />
            &nbsp;{this.props.i18n._(val)}
        </label>);
    })

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            {this.getRadioButtons()}
        </div>
        {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
        {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
    </div>);
}
