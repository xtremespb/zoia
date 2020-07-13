/* eslint-disable react/prop-types */
import React, { lazy, Component } from 'react';
import { connect } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { t } from '@lingui/macro';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import UIkit from '../../../../shared/lib/uikit';

const FormBuilder = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "FormBuilder" */'../../../../shared/react/FormBuilder/index.jsx'));

class DialogFolderEdit extends Component {
    constructor(props) {
        super(props);
        this.editFoldersForm = React.createRef();
    }

    componentDidMount = () => {
        this.dialogFolderEdit = UIkit.modal(`#dialogFolderEdit_${this.props.id}`, {
            bgClose: false,
            escClose: true,
            stack: true
        });
    }

    componentWillUnmount = () => {
        this.dialogFolderEdit.$destroy(true);
    }

    show = async item => {
        this.resetEditForm();
        await this.editFoldersForm.current.hideErrors();
        this.editKey = null;
        if (item) {
            const data = cloneDeep(item);
            this.editKey = data.key;
            delete data.key;
            delete data.title;
            delete data.children;
            Object.keys(data.data).map(i => data[i] = data.data[i]);
            delete data.data;
            this.editFoldersForm.current.deserializeData(data);
        }
        await this.dialogFolderEdit.show();
        this.editFoldersForm.current.setFocusOnFields();
    }

    hide = () => {
        this.dialogFolderEdit.hide();
    }

    resetEditForm = () => this.editFoldersForm.current.resetValuesToDefault();

    onSaveButtonClick = async e => {
        e.preventDefault();
        const { data } = this.editFoldersForm.current.serializeData();
        const vdata = this.editFoldersForm.current.validateData(data);
        await this.editFoldersForm.current.hideErrors();
        if (vdata && vdata.length) {
            this.editFoldersForm.current.showErrors(vdata);
            return;
        }
        data.key = data.key || this.editKey || uuid().replace(/-/gm, '');
        // data.children = data.children || this.editChildren;
        if (this.props.onSaveButtonClickHandler && typeof this.props.onSaveButtonClickHandler === 'function') {
            this.props.onSaveButtonClickHandler(data);
        }
        this.hide();
    }

    getEditForm = i18n => (<FormBuilder
        ref={this.editFoldersForm}
        prefix="editFoldersForm"
        UIkit={UIkit}
        axios={axios}
        i18n={i18n}
        tabs={this.props.appDataRuntime.config.languages}
        commonFields={['id']}
        data={
            [
                [
                    {
                        id: 'id',
                        type: 'text',
                        css: 'uk-form-width-small',
                        label: `${i18n._(t`ID`)}:`,
                        autofocus: true
                    },
                    {
                        id: 'title',
                        type: 'text',
                        css: 'uk-form-width-medium',
                        label: `${i18n._(t`Title`)}:`
                    }
                ]
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
        validation={
            {
                id: {
                    mandatory: true,
                    regexp: /^[a-zA-Z0-9_-]{1,32}$/
                },
                title: {
                    mandatory: true,
                    maxLength: 64
                }
            }
        }
        onFormPreSubmit={this.onSaveButtonClick}
    />);

    render = () => (<div>
        <div id={`dialogFolderEdit_${this.props.id}`} style={{ display: 'none' }}>
            <div className="uk-modal-dialog">
                <div className="uk-modal-body">
                    {this.getEditForm(this.props.i18n)}
                </div>
                <div className="uk-modal-footer uk-text-right">
                    <button className="uk-button uk-button-default uk-modal-close uk-margin-small-right" type="button">{this.props.i18n._(t`Cancel`)}</button>
                    <button className="uk-button uk-button-primary" type="button" onClick={this.onSaveButtonClick}>{this.props.i18n._(t`Save`)}</button>
                </div>
            </div>
        </div>
    </div>);
}

export default connect(store => ({
    appData: store.appData,
    appDataRuntime: store.appDataRuntime
}),
    () => ({}), null, { forwardRef: true })(DialogFolderEdit);
