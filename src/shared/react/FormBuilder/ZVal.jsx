/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZVal extends Component {
    focus = () => this.field.focus()

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <input
                ref={field => { this.field = field; }}
                type={this.props.type || 'text'}
                className={`uk-input${this.props.error ? ' uk-form-danger' : ''}${this.props.css ? ` ${this.props.css}` : ''}`}
                value={this.props.value}
                onChange={e => this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, e.target.value) : null}
                disabled={this.props.disabled}
                readOnly
            />&nbsp;<button type="button" className="uk-button uk-button-default" onClick={this.props.onSetValButtonClick}>...</button>
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
