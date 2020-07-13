/* eslint react/prop-types:0, react/prefer-stateless-function:0, no-param-reassign:0 */

import React, { Component } from 'react';
import Tree from 'rc-tree';
import './ztree.css';

export default class ZTree extends Component {
    constructor(props) {
        super(props);
        this.ZTreeEditDialog = React.createRef();
    }

    state = {
        autoExpandParent: true
    }

    onExpand = expandedKeys => {
        this.props.onValueChanged(this.props.originalId, null, null, null, expandedKeys);
        this.setState({
            autoExpandParent: false
        });
    }

    onAddItemButtonClick = e => {
        e.preventDefault();
        if (this.props.onAddItemButtonClick && typeof this.props.onAddItemButtonClick === 'function') {
            this.props.onAddItemButtonClick(e);
        }
    }

    onEditItemButtonClick = e => {
        e.preventDefault();
        if (this.props.onEditItemButtonClick && typeof this.props.onEditItemButtonClick === 'function') {
            this.props.onEditItemButtonClick(e);
        }
    }

    onDeleteItemButtonClick = e => {
        e.preventDefault();
        if (this.props.onDeleteItemButtonClick && typeof this.props.onDeleteItemButtonClick === 'function') {
            this.props.onDeleteItemButtonClick(e);
        }
    }

    onDragEnter = info => this.props.onValueChanged(this.props.originalId, null, null, null, info.expandedKeys)

    loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item.key === key) {
                callback(item, index, arr);
                return;
            }
            if (item.children) {
                this.loop(item.children, key, callback);
            }
        });
    };

    onSelect = selectedKeys => this.props.onValueChanged(this.props.originalId, null, selectedKeys, null, null);

    onCheck = checkedKeys => this.props.onValueChanged(this.props.originalId, null, null, checkedKeys, null);

    onDrop = info => {
        const dropKey = info.node.props.eventKey;
        const dragKey = info.dragNode.props.eventKey;
        const dropPos = info.node.props.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const data = [...this.props.tree];
        let dragObj;
        this.loop(data, dragKey, (item, index, arr) => {
            arr.splice(index, 1);
            dragObj = item;
        });
        if (!info.dropToGap) {
            this.loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.push(dragObj);
            });
        } else if (
            (info.node.props.children || []).length > 0 && info.node.props.expanded && dropPosition === 1) {
            this.loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.unshift(dragObj);
            });
        } else {
            let ar;
            let i;
            this.loop(data, dropKey, (item, index, arr) => {
                ar = arr;
                i = index;
            });
            if (dropPosition === -1) {
                ar.splice(i, 0, dragObj);
            } else {
                ar.splice(i + 1, 0, dragObj);
            }
        }
        this.props.onValueChanged(this.props.originalId, data, null, null, null, null);
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <div>
                <button type="button" className="uk-icon-button uk-button-primary uk-margin-small-right" uk-icon="plus" onClick={this.onAddItemButtonClick} uk-tooltip={this.props.addItemButtonLabel} />
                <button type="button" className="uk-icon-button uk-margin-small-right" uk-icon="pencil" onClick={this.onEditItemButtonClick} uk-tooltip={this.props.editItemButtonLabel} />
                <button type="button" className="uk-icon-button uk-button-danger uk-margin-small-right" uk-icon="trash" onClick={this.onDeleteItemButtonClick} uk-tooltip={this.props.deleteItemButtonLabel} />
            </div>
            <div className="uk-margin-top">
                {this.props.tree.length ? (<Tree
                    expandedKeys={this.props.expanded}
                    autoExpandParent={this.state.autoExpandParent}
                    treeData={this.props.tree}
                    onExpand={this.onExpand}
                    draggable={this.props.draggable}
                    selectable={this.props.selectable}
                    checkable={this.props.checkable}
                    onDragStart={this.onDragStart}
                    onDragEnter={this.onDragEnter}
                    onDrop={this.onDrop}
                    selectedKeys={this.props.selected}
                    onSelect={this.onSelect}
                    checkedKeys={this.props.checked}
                    onCheck={this.onCheck}
                    checkStrictly={true}
                />) : (<div className="uk-text-small uk-text-muted">{this.props.noItemsLabel}</div>)}
            </div>
        </div>
    </div>);
}
