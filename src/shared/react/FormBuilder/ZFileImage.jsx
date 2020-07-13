/* eslint react/prop-types:0 */

import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default class ZFileImage extends Component {
    onValueChanged = e => {
        const files = Array.from(e.target.files);
        let stop;
        if (this.props.allowedTypes && Array.isArray(this.props.allowedTypes)) {
            files.map(f => {
                if (!this.props.allowedTypes.find(t => t === f.type)) {
                    stop = true;
                }
            });
        }
        if (stop) {
            this.props.UIkit.notification({ message: this.props.lang.ERR_UNSUPPORTED_FILE_TYPE, status: 'danger' });
            return;
        }
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

    onDragOverFilesArea = e => {
        e.preventDefault();
        e.stopPropagation();
    }

    onDragEnd(result) {
        if (result.destination) {
            const files = this.props.value;
            const [removed] = files.splice(result.source.index, 1);
            files.splice(result.destination.index, 0, removed);
            this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files, true) : null;
        }
    }

    onDeleteImageButtonClick = e => {
        e.preventDefault();
        const files = this.props.value;
        const { index } = e.currentTarget.dataset;
        files.splice(index, 1);
        this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, files, true) : null;
    }

    getFilesList = () => (<DragDropContext onDragEnd={result => this.onDragEnd(result)}>
        <Droppable droppableId="droppable" direction="horizontal">
            {provided => (
                <>
                    <ul
                        ref={provided.innerRef}
                        className="uk-grid uk-grid-collapse uk-flex-wrap uk-flex uk-card uk-card-default uk-card-body uk-card-small uk-box-shadow-small"
                        uk-silder="true"
                        id={`${this.props.id}_fileImage_List`}
                        {...provided.droppableProps}
                    >
                        {this.props.value.map((item, index) => {
                            let imageSrc;
                            try {
                                imageSrc = window.URL.createObjectURL(item);
                            } catch (e) {
                                imageSrc = `${this.props.thumbURL}/${this.props.thumbID ? `${this.props.thumbID}/` : ''}${this.props.thumbPrefix || ''}${item.name}.${this.props.thumbExtension}`;
                            }
                            return (<Draggable key={`${this.props.id}_${item.name}`} draggableId={item.name} index={index}>
                                {providedDraggable => (
                                    <li
                                        key={`${this.props.id}_${item.name}`}
                                        ref={providedDraggable.innerRef}
                                        {...providedDraggable.draggableProps}
                                        {...providedDraggable.dragHandleProps}
                                    >
                                        <div className="uk-panel zform-file-image-thumb-container uk-inline">
                                            <img className="zform-file-image-thumb" src={imageSrc} alt="" />
                                            <div className="uk-overlay uk-position-bottom">
                                                <button className="uk-icon-button uk-box-shadow-small" data-index={index} uk-icon="icon:close;ratio:0.8" onClick={this.onDeleteImageButtonClick} type="button" />
                                            </div>
                                        </div>
                                    </li>
                                )}
                            </Draggable>);
                        })}
                    </ul>
                    {provided.placeholder}
                </>
            )}
        </Droppable>
    </DragDropContext>);

    render = () => (<div className="uk-margin-small-right">
        <label className="uk-form-label">{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="zform-drop-area uk-text-center uk-width-large" onDragOver={this.onDragOverFilesArea} onDrop={this.onDropFilesArea}>
            <span className="uk-text-middle">
                {this.props.lang.FILE_IMAGE_ATTACH}
                &nbsp;
                <label className="zform-upload-btn-wrapper uk-link" ref={field => { this.field = field; }}>
                    <input type="file" multiple={true} onChange={this.onValueChanged} />
                    {this.props.lang.FILE_IMAGE_ORSELECT}
                </label>
            </span>
        </div>
        {this.props.value && Array.isArray(this.props.value) && this.props.value.length ? <div className="zform-files-list uk-width-large">{this.getFilesList()}</div> : <></>}
    </div>);
}
