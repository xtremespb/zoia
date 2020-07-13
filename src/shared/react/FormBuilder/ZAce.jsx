/* eslint react/prop-types:0 */

import React, { Component } from 'react';
import AceEditor from 'react-ace';

import './ace-webpack-resolver';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';

export default class ZAce extends Component {
    constructor(props) {
        super(props);
        this.ace = React.createRef();
    }

    onChange = value => {
        if (this.props.onValueChanged && typeof this.props.onValueChanged === 'function') {
            this.props.onValueChanged(this.props.originalId, value);
        }
    }

    focus = () => this.field.focus()

    onFileInputValueChanged = e => {
        const file = Array.from(e.target.files)[0];
        const formData = new FormData();
        formData.append('upload', file);
        if (this.props.imageUploadExtras) {
            Object.keys(this.props.imageUploadExtras).map(k => formData.append(k, this.props.imageUploadExtras[k]));
        }
        this.props.axios.post(this.props.imageUploadURL, formData, {
            headers: {
                'content-type': 'multipart/form-data'
            }
        }).then(async res => {
            if (res && res.data && res.data.statusCode === 200 && res.data.url) {
                this.ace.current.editor.session.insert(this.ace.current.editor.getCursorPosition(), `<img src="${res.data.url}" alt="" />`);
                this.ace.current.focus();
            }
            // Error
        }).catch(async err => {
            // TODO: Display an Error
            // eslint-disable-next-line no-console
            console.error(err);
        });
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div>
            <label className="zform-upload-btn-wrapper" ref={field => { this.field = field; }}>
                <input type="file" multiple={false} onChange={this.onFileInputValueChanged} />
                <span uk-tooltip={this.props.i18n._(this.props.imageUploadLabel.id)} className="uk-icon-button uk-margin-small-right uk-margin-small-bottom" uk-icon="image" />
            </label>
            <AceEditor
                ref={this.ace}
                mode="html"
                theme="github"
                value={this.props.value || ''}
                onChange={this.onChange}
                name={this.props.id}
                editorProps={{
                    $blockScrolling: true,
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                }}
                fontSize={14}
                width="100%"
                height="auto"
                maxLines={30}
                minLines={5}
            />
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
