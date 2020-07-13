/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZSelect extends Component {
    focus = () => this.field.focus();

    onValueChanged = e => {
        const { value } = e.target;
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, value) : null;
    }

    getCheckboxes = () => Object.keys(this.props.values).map((key) => {
        const val = this.props.values[key];
        return (<label key={`${this.props.id}_checkbox_${key}`} className="uk-margin-small-right"><input className="uk-checkbox" type="checkbox" data-id={key} checked={this.props.value[key]} onChange={this.onValueChanged} disabled={this.props.disabled} />&nbsp;{this.props.i18n._(val)}</label>);
    })

    getOptions = () => Object.keys(this.props.values).map((key) => {
        const val = this.props.values[key];
        return (<option key={`${this.props.id}_option_${key}`} value={key}>{this.props.i18n._(val)}</option>);
    })

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <select
                ref={field => { this.field = field; }}
                id={this.props.id}
                className={`uk-select${this.props.error ? ' uk-form-danger' : ''}${this.props.css ? ` ${this.props.css}` : null}`}
                value={this.props.value}
                onChange={this.onValueChanged}
                disabled={this.props.disabled}
            >{this.getOptions()}</select>
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
