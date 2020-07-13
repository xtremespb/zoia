/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZCaptcha extends Component {
    state = {
        source: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' // Blank image
    }

    focus = () => this.field.focus()

    reloadCaptcha = (focus) => {
        this.setState({
            source: `${this.props.source}?_=${Math.floor(Math.random() * 20)}`
        });
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, '') : null;
        if (focus) {
            this.field.focus();
        }
    }

    componentDidMount = () => {
        this.reloadCaptcha();
    }

    onCaptchaImageClick = e => {
        e.preventDefault();
        this.reloadCaptcha(true);
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <div className="uk-flex uk-flex-middle zform-captcha-image-wrap">
                <input
                    ref={field => { this.field = field; }}
                    type="text"
                    className={`uk-input uk-form-large uk-form-width-small${this.props.error ? ' uk-form-danger' : ''}${this.props.css ? ` ${this.props.css}` : ''}`}
                    value={this.props.value}
                    onChange={e => this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, e.target.value) : null}
                    disabled={this.props.disabled}
                />
                <a href="#" onClick={this.onCaptchaImageClick}>
                    <img ref={img => { this.captchaImage = img; }} className="uk-margin-left" src={this.state.source} alt="" />
                    <span uk-icon="icon:refresh;ratio:0.8" />
                </a>
            </div>
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
