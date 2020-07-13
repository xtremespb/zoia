/* eslint react/prop-types:0, react/jsx-props-no-spreading:0 */

import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default class ZData extends Component {
    focus = () => { }

    onDragEnd(result) {
        if (result.destination) {
            const { values } = this.props;
            const [removed] = values.splice(result.source.index, 1);
            values.splice(result.destination.index, 0, removed);
            this.props.onValueChanged && typeof this.props.onValueChanged === 'function' ? this.props.onValueChanged(this.props.originalId, values, true) : null;
        }
    }

    // getData = () => this.props.view && typeof this.props.view === 'function' ?  this.props.values.map(v => this.props.view(v)) : null;
    getData = () => {
        if (this.props.view && typeof this.props.view === 'function') {
            return (<DragDropContext onDragEnd={result => this.onDragEnd(result)}>
                <Droppable droppableId="droppable" direction="vertical">
                    {provided => (
                        <>
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {this.props.values.map((item, index) => (<Draggable key={item.id} draggableId={item.id} index={index}>
                                    {providedDraggable => (
                                        <div
                                            key={item.id}
                                            className={`uk-card uk-card-default uk-card-body uk-card-small uk-box-shadow-small${this.props.css ? ` ${this.props.css}` : ''}`}
                                            ref={providedDraggable.innerRef}
                                            {...providedDraggable.draggableProps}
                                            {...providedDraggable.dragHandleProps}
                                        >
                                            {this.props.view(item)}
                                        </div>
                                    )}
                                </Draggable>))}
                            </div>
                            {provided.placeholder}
                        </>
                    )}
                </Droppable>
            </DragDropContext>)
        }
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            {this.props.buttons}
            <div>
                <this.props.wrap>
                    {this.getData()}
                </this.props.wrap>
            </div>
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
