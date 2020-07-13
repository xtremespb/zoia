/* eslint react/prop-types:0 */

import React, { Component } from 'react';

const DEFAULT_SCRIPT_URL = '//cdn.ckeditor.com/4.11.2/standard/ckeditor.js';

export default class ZCKEditor4 extends Component {
    constructor(props) {
        super(props);
        this.unmounting = false;
    }

    loadScript = url => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.addEventListener('load', () => resolve(script), false);
        script.addEventListener('error', () => reject(script), false);
        document.body.appendChild(script);
    });

    componentDidMount() {
        if (!this.props.scriptLoaded) {
            this.loadScript(this.props.scriptURL || DEFAULT_SCRIPT_URL).then(() => this.onLoad());
        } else {
            this.onLoad();
        }
    }

    componentWillReceiveProps(props) {
        const editor = this.editorInstance;
        if (editor && editor.getData() !== props.value) {
            editor.setData(props.value);
        }
    }

    componentWillUnmount() {
        this.unmounting = true;
    }

    onLoad() {
        if (this.unmounting) return;
        if (!window.CKEDITOR) {
            console.error('CKEditor not found');
            return;
        }
        this.editorInstance = window.CKEDITOR.appendTo(
            this.ckeditor,
            this.props.config,
            this.props.content
        );
        this.editorInstance.on('change', this.onEditorDataChange);
    }

    focus = () => this.field.focus()

    onEditorDataChange = e => {
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, e.editor.getData()) : null;
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <div ref={input => { this.ckeditor = input; }} />
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-s)mall uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
