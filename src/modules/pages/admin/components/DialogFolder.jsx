/* eslint-disable react/prop-types, no-param-reassign */
import React, { lazy, Component } from 'react';
import { connect } from 'react-redux';
import { t } from '@lingui/macro';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import UIkit from '../../../../shared/lib/uikit';
import DialogFolderEdit from './DialogFolderEdit.jsx';

const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../shared/react/FormBuilder/index.jsx'));

class DialogFolder extends Component {
    constructor(props) {
        super(props);
        this.editFoldersForm = React.createRef();
        this.dialogFolderEdit = React.createRef();
    }

    componentDidMount = () => {
        this.dialogFolder = UIkit.modal(`#dialogFolder_${this.props.id}`, {
            bgClose: false,
            escClose: true,
            stack: true
        });
    }

    componentWillUnmount = () => {
        this.dialogFolder.$destroy(true);
    }

    show = () => {
        this.dialogFolder.show();
    }

    hide = () => {
        this.dialogFolder.hide();
    }

    loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item.key === key) {
                callback(item, index, arr);
            } else if (item.children) {
                this.loop(item.children, key, callback);
            }
        });
    }

    setTreeValues = (tree = [], selected = [], checked = []) => this.editFoldersForm.current.setValue('folders', { tree, selected, checked });

    onRootButtonClick = e => {
        e.preventDefault();
        const folders = this.editFoldersForm.current.getValue('folders');
        folders.selected = [];
        if (this.props.onSaveButtonClickHandler && typeof this.props.onSaveButtonClickHandler === 'function') {
            this.props.onSaveButtonClickHandler(folders);
        }
        this.hide();
    }

    loopFilter = (data, key) => data.filter(item => {
        if (item.children) {
            item.children = this.loopFilter(item.children, key);
        }
        return item.key !== key;
    });

    loopEach = (data, callback) => {
        data.forEach((item, index, arr) => {
            callback(item, index, arr);
            if (item.children) {
                this.loopEach(item.children, callback);
            }
        });
    }

    onSaveButtonClick = e => {
        e.preventDefault();
        const folders = this.editFoldersForm.current.getValue('folders');
        if (!folders.selected.length) {
            UIkit.notification({
                message: this.props.i18n._(t`Please select an item first`),
                status: 'danger'
            });
            return;
        }
        if (this.props.onSaveButtonClickHandler && typeof this.props.onSaveButtonClickHandler === 'function') {
            this.props.onSaveButtonClickHandler(folders);
        }
        this.hide();
    }

    onAddTreeItemButtonClick = e => {
        e.preventDefault();
        this.dialogFolderEdit.current.show();
    }

    onEditTreeItemButtonClick = e => {
        e.preventDefault();
        const folders = this.editFoldersForm.current.getValue('folders');
        let item;
        this.loop(folders.tree, folders.selected[0], i => item = i);
        if (item) {
            this.dialogFolderEdit.current.show(item);
        }
    }

    onDeleteTreeItemButtonClick = async e => {
        e.preventDefault();
        const folders = this.editFoldersForm.current.getValue('folders');
        (folders.selected && folders.selected.length ? folders.selected || [] : folders.checked.checked || []).map(key => folders.tree = this.loopFilter(folders.tree, key));
        folders.checked = [];
        folders.selected = [];
        await this.editFoldersForm.current.setValue('folders', []);
        await this.editFoldersForm.current.setValue('folders', folders);
    }

    onSaveFolderClickHandler = async data => {
        const folders = this.editFoldersForm.current.getValue('folders');
        let item;
        // Does the folder already exist?
        this.loop(folders.tree, data.key, i => {
            item = i;
        });
        const tree = cloneDeep(data);
        delete tree.key;
        delete tree.id;
        const dataTree = {
            data: tree,
            id: data.id,
            key: data.key
        };
        if (item) {
            this.loop(folders.tree, data.key, i => {
                i.data = dataTree.data;
                i.id = dataTree.id;
                if (typeof i.children === 'undefined') {
                    delete i.children;
                }
            });
        } else if (folders.selected.length) {
            let selected;
            this.loop(folders.tree, folders.selected[0], i => {
                selected = i;
            });
            selected.children = selected.children || [];
            selected.children.push(dataTree);
        } else {
            folders.tree.push(dataTree);
        }
        if (folders.expanded && folders.expanded.indexOf(data.key) === -1) {
            folders.expanded.push(data.key);
        }
        this.loopEach(folders.tree, i => {
            const defaultTitle = i.data[Object.keys(this.props.appDataRuntime.config.languages)[0]] ? i.data[Object.keys(this.props.appDataRuntime.config.languages)[0]].title : '';
            const title = i.data[this.props.appData.language] ? i.data[this.props.appData.language].title : defaultTitle;
            i.title = title;
        });
        await this.editFoldersForm.current.setValue('folders', []);
        await this.editFoldersForm.current.setValue('folders', folders);
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editFoldersForm}
        prefix="editFoldersForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        data={
            [
                {
                    id: 'folders',
                    type: 'tree',
                    draggable: true,
                    checkable: true,
                    selectable: true,
                    addItemButtonLabel: i18n._(t`Add`),
                    editItemButtonLabel: i18n._(t`Edit`),
                    deleteItemButtonLabel: i18n._(t`Delete`),
                    onAddItemButtonClick: e => this.onAddTreeItemButtonClick(e),
                    onEditItemButtonClick: e => this.onEditTreeItemButtonClick(e),
                    onDeleteItemButtonClick: e => this.onDeleteTreeItemButtonClick(e),
                }
            ]
        }
        lang={{
            ERR_VMANDATORY: t`Field is required`,
            ERR_VFORMAT: t`Invalid format`,
            ERR_VNOMATCH: t`Passwords do not match`,
            ERR_LOAD: t`Could not load data from server`,
            ERR_SAVE: t`Could not save data`,
            WILL_BE_DELETED: t`will be deleted. Are you sure?`,
            YES: t`Yes`,
            CANCEL: t`Cancel`
        }}
    />);

    render = () => (<div>
        <DialogFolderEdit
            i18n={this.props.i18n}
            ref={this.dialogFolderEdit}
            onSaveButtonClickHandler={this.onSaveFolderClickHandler}
        />
        <div id={`dialogFolder_${this.props.id}`} style={{ display: 'none' }}>
            <div className="uk-modal-dialog">
                <div className="uk-modal-body">
                    {this.getEditForm(this.props.i18n)}
                </div>
                <div className="uk-modal-footer uk-text-right">
                    <button className="uk-button uk-button-default uk-modal-close uk-margin-small-right" type="button">{this.props.i18n._(t`Cancel`)}</button>
                    <button className="uk-button uk-button-secondary uk-margin-small-right" type="button" onClick={this.onRootButtonClick}>{this.props.i18n._(t`Root`)}</button>
                    <button className="uk-button uk-button-primary" type="button" onClick={this.onSaveButtonClick}>{this.props.i18n._(t`Select`)}</button>
                </div>
            </div>
        </div>
    </div>);
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime
}),
    () => ({}), null, { forwardRef: true })(DialogFolder);
