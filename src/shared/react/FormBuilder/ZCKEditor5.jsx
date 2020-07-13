/* eslint react/prop-types:0 */

import React, { Component } from 'react';
import CKEditorImageUploadAdapter from './CKEditorImageUploadAdapter';

export default class ZCKEditor5 extends Component {
    constructor(props) {
        super(props);
        if (props.languages && Array.isArray(props.languages)) {
            props.languages.filter(language => language !== 'en').map(language => import(`@ckeditor/ckeditor5-build-classic/build/translations/${language}`));
        }
    }

    focus = () => this.field.focus()

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div>
            <this.props.CKEditor
                config={{
                    language: this.props.language || 'en'
                }}
                editor={this.props.editor}
                ref={field => { this.field = field; }}
                data={this.props.value || ''}
                onInit={editor => {
                    const ck = editor;
                    ck.plugins.get('FileRepository').createUploadAdapter = loader => new CKEditorImageUploadAdapter(loader, {
                        url: this.props.imageUploadURL,
                        extras: this.props.imageUploadExtras
                    }, this.props.axios);
                }}
                onChange={(event, editor) => {
                    if (this.props.onValueChanged && typeof this.props.onValueChanged === 'function') {
                        const data = editor.getData();
                        this.props.onValueChanged(this.props.originalId, data);
                    }
                }}
                onBlur={() => {
                }}
                onFocus={() => {
                }}
            />
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
