/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZFile extends Component {
    onValueChanged = e => {
        const files = Array.from(e.target.files);
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files) : null;
    }

    onDropFilesArea = e => {
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files);
            this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files) : null;
        }
    }

    onFileListItemClick = e => {
        e.preventDefault();
        const { filename } = e.currentTarget.dataset;
        if (this.props.value.find((item) => item.name === filename && !item.lastModified)) {
            this.props.UIkit.modal.confirm(`${filename} ${this.props.lang.WILL_BE_DELETED}`, { labels: { ok: this.props.lang.YES, cancel: this.props.lang.CANCEL }, stack: true }).then(() => {
                // Okay, delete the file
                const files = this.props.value.filter((item) => item.name !== filename);
                this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files, true) : null;
            }, () => {
                // Cancel
            });
        } else {
            const files = this.props.value.filter((item) => item.name !== filename);
            this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files, true) : null;
        }
    }

    onDragOverFilesArea = e => {
        e.preventDefault();
        e.stopPropagation();
    }

    getFilesList = () => this.props.value.map(item => (<li key={`${this.props.id}_${item.name}`}>{item.name}&nbsp;<a href="" uk-icon="icon:close" data-filename={item.name} onClick={this.onFileListItemClick}>&nbsp;</a></li>))

    render = () => (<div className="uk-margin-small-right">
        <label className="uk-form-label">{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="zform-drop-area uk-text-center uk-width-large" onDragOver={this.onDragOverFilesArea} onDrop={this.onDropFilesArea}>
            <span className="uk-text-middle">
                {this.props.lang.FILE_ATTACH}
                &nbsp;
                <label className="zform-upload-btn-wrapper uk-link" ref={field => { this.field = field; }}>
                    <input type="file" multiple={true} onChange={this.onValueChanged} />
                    {this.props.lang.FILE_ORSELECT}
                </label>
            </span>
        </div>
        {this.props.value && Array.isArray(this.props.value) && this.props.value.length ? <ul className="zform-files-list uk-list">{this.getFilesList()}</ul> : <></>}
    </div>);
}
