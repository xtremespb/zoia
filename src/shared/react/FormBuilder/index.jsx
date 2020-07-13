// Import third-party modules
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash/cloneDeep';
// Import components
import ZButton from './ZButton.jsx';
import ZText from './ZText.jsx';
import ZVal from './ZVal.jsx';
import ZTags from './ZTags.jsx';
import ZData from './ZData.jsx';
import ZTree from './ZTree.jsx';
import ZTextarea from './ZTextarea.jsx';
import ZCKEditor4 from './ZCKEditor4.jsx';
import ZCKEditor5 from './ZCKEditor5.jsx';
import ZFile from './ZFile.jsx';
import ZFileImage from './ZFileImage.jsx';
import ZRadio from './ZRadio.jsx';
import ZCheckbox from './ZCheckbox.jsx';
import ZSelect from './ZSelect.jsx';
import ZCaptcha from './ZCaptcha.jsx';
import ZDivider from './ZDivider.jsx';
import ZWrap from './ZWrap.jsx';
import ZLoading from './ZLoading.jsx';
import ZMessage from './ZMessage.jsx';
import ZDatePicker from './ZDatePicker.jsx';
import ZAce from './ZAce.jsx';
// Import styles
import './style.css';

const ERR_NONE = 0;
const ERR_VMANDATORY = 1;
const ERR_VFORMAT = 2;
const ERR_VNOMATCH = 3;
const ERR_VTOOSHORT = 4;
const ERR_VTOOLONG = 5;

export default class ZFormBuilder extends Component {
    state = {
        data: {},
        dataStorage: {},
        tab: Object.keys(this.props.tabs)[0],
        tabs: this.props.defaultTabs,
        errors: {},
        errorMessages: {},
        errorMessage: null,
        loading: false,
        allTabs: {},
        saving: false
    }

    static propTypes = {
        prefix: PropTypes.string.isRequired,
        tabs: PropTypes.objectOf(PropTypes.string),
        defaultTabs: PropTypes.arrayOf(PropTypes.string),
        data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])).isRequired,
        commonFields: PropTypes.arrayOf(PropTypes.string),
        validation: PropTypes.objectOf(PropTypes.object),
        lang: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        save: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        load: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        UIkit: PropTypes.func.isRequired,
        onLoadError: PropTypes.func,
        onLoadSuccess: PropTypes.func,
        onSaveError: PropTypes.func,
        onSaveSuccess: PropTypes.func,
        onDataDeserialized: PropTypes.func,
        axios: PropTypes.func.isRequired,
        simple: PropTypes.bool,
        i18n: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]).isRequired,
        locale: PropTypes.string,
        doNotSetFocusOnMount: PropTypes.bool,
        onFormBuilt: PropTypes.func,
        onFormPreSubmit: PropTypes.func
    }

    static defaultProps = {
        tabs: {
            default: 'Default'
        },
        defaultTabs: ['default'],
        commonFields: [],
        validation: {},
        lang: {
            ERR_VMANDATORY: 'Field is required',
            ERR_VFORMAT: 'Invalid format',
            ERR_VNOMATCH: 'Fields do not match',
            ERR_LOAD: 'Could not load data from server',
            ERR_SAVE: 'Could not save data',
            WILL_BE_DELETED: 'will be deleted. Are you sure?',
            ERR_VTOOSHORT: 'Too short',
            ERR_VTOOLONG: 'Too long',
            ERR_UNSUPPORTED_FILE_TYPE: 'Unsupported image type',
            YES: 'Yes',
            CANCEL: 'Cancel',
            FILE_ATTACH: 'Attach file(s) by dropping them here',
            FILE_ORSELECT: 'or selecting one',
            FILE_IMAGE_ATTACH: 'Attach image(s) by dropping them here',
            FILE_IMAGE_ORSELECT: 'or selecting one',
        },
        save: {
            url: null,
            method: 'GET'
        },
        load: {
            url: null,
            method: 'GET'
        },
        onLoadError: null,
        onLoadSuccess: null,
        onSaveError: null,
        onSaveSuccess: null,
        onDataDeserialized: null,
        simple: false,
        locale: 'en',
        doNotSetFocusOnMount: false,
        onFormBuilt: null,
        onFormPreSubmit: null
    }

    setLoading = async flag => new Promise(resolve => this.setState({ loading: flag }, () => resolve()));

    getValuesFromData = data => {
        const values = {};
        data.map(item => {
            if (Array.isArray(item)) {
                item.map(ai => {
                    if (ai.type.match(/^(button|divider|message)$/)) {
                        return;
                    }
                    switch (ai.type) {
                        case 'radio':
                            values[ai.id] = ai.defaultValue || (ai.values ? Object.keys(ai.values)[0] : '');
                            break;
                        case 'checkbox':
                            values[ai.id] = {};
                            break;
                        case 'tags':
                        case 'data':
                            values[ai.id] = [];
                            break;
                        case 'select':
                            values[ai.id] = ai.defaultValue || (ai.values ? Object.keys(ai.values)[0] : '');
                            break;
                        default:
                            values[ai.id] = ai.defaultValue || '';
                    }
                });
            } else {
                if (item.type.match(/^(button|divider|message)$/)) {
                    return;
                }
                switch (item.type) {
                    case 'radio':
                        values[item.id] = item.defaultValue || (item.values ? Object.keys(item.values)[0] : '');
                        break;
                    case 'checkbox':
                        values[item.id] = {};
                        break;
                    case 'tags':
                    case 'data':
                        values[item.id] = [];
                        break;
                    case 'select':
                        values[item.id] = item.defaultValue || (item.values ? Object.keys(item.values)[0] : '');
                        break;
                    default:
                        values[item.id] = item.defaultValue || '';
                }
            }
        });
        return values;
    }

    resetValuesToDefault = () => {
        const { data } = this.props;
        const dataStorage = {};
        const tabs = [Object.keys(this.props.tabs)[0]];
        const tab = Object.keys(this.props.tabs)[0];
        dataStorage[tab] = this.getValuesFromData(data);
        this.setState({
            dataStorage,
            tabs,
            tab
        });
    }

    constructor(props) {
        super(props);
        this.state.data = props.data;
        if ((!this.props.load || !this.props.load.url) && props.tabs) {
            this.state.tabs = [Object.keys(props.tabs)[0]];
        }
        const { data } = props;
        const values = this.getValuesFromData(data);
        Object.keys(props.tabs).map(key => {
            this.state.dataStorage[key] = {};
            this.state.allTabs[key] = true;
            this.state.errors[key] = {};
            this.state.errorMessages[key] = {};
        });
        this.state.dataStorage[this.state.tab] = values;
        this.types = {};
        this.fields = {};
        this.formDataExtra = {};
        this.state.data.map(item => {
            if (Array.isArray(item)) {
                item.map(ai => {
                    this.types[ai.id] = { type: ai.type, values: ai.values };
                });
            } else {
                this.types[item.id] = { type: item.type, values: item.values };
            }
        });
    }

    getData = () => this.state.dataStorage;

    setFormDataExtra = data => {
        this.formDataExtra = data;
    }

    setFocusOnFields = () => {
        this.state.data.map(item => {
            if (Array.isArray(item)) {
                item.map(ai => {
                    if (ai.autofocus && !this.state.loading && this.fields[ai.id] && this.fields[ai.id].focus) {
                        this.fields[ai.id].focus();
                    }
                });
            } else if (item.autofocus && !this.state.loading && this.fields[item.id] && this.fields[item.id].focus) {
                this.fields[item.id].focus();
            }
        });
    }

    componentDidMount = () => {
        // This is required no to set focus on "+" icon
        this.props.UIkit.util.on(this.tabDivDropdown, 'hidden', () => {
            this.props.UIkit.tab(this.tabDiv).show(this.state.tabs.indexOf(this.state.tab));
        });
        if (this.props.load && this.props.load.url) {
            this.loadData();
        }
        if (!this.props.doNotSetFocusOnMount) {
            this.setFocusOnFields();
        }
        if (this.props.onFormBuilt && typeof this.props.onFormBuilt === 'function') {
            this.props.onFormBuilt();
        }
    }

    setProperty = (id, property, value) => new Promise(resolve => {
        const data = cloneDeep(this.state.data);
        data.map((item, i1) => {
            if (Array.isArray(item)) {
                item.map((ai, i2) => {
                    if (ai.id === id) {
                        data[i1][i2][property] = value;
                    }
                });
            } else if (item.id === id) {
                data[i1][property] = value;
            }
        });
        this.setState({
            data
        }, () => resolve());
    });

    getProperty = (id, property) => {
        const { data } = this.state;
        let value = null;
        data.map((item, i1) => {
            if (Array.isArray(item)) {
                item.map((ai, i2) => {
                    if (ai.id === id) {
                        value = data[i1][i2][property];
                    }
                });
            } else if (item.id === id) {
                value = data[i1][property];
            }
        });
        return value;
    };

    getValue = (id, tab = this.state.tab) => this.state.dataStorage[tab][id];

    setValue = (property, value, tab = this.state.tab) => new Promise(resolve => {
        const dataStorage = cloneDeep(this.state.dataStorage);
        dataStorage[tab][property] = value;
        this.setState({
            dataStorage
        }, () => resolve());
    });

    onGenericFieldValueChanged = (id, value) => {
        const storage = cloneDeep(this.state.dataStorage);
        storage[this.state.tab][id] = value;
        this.setState({
            dataStorage: storage
        }, () => {
            // Call onChange if defined
            this.state.data.map(item => {
                if (Array.isArray(item)) {
                    item.map(ai => {
                        if (ai.id === id && ai.onChange && typeof ai.onChange === 'function') {
                            ai.onChange(id, value);
                        }
                    });
                } else if (item.id === id && item.onChange && typeof item.onChange === 'function') {
                    item.onChange(id, value);
                }
            });
        });
    }

    onTreeFieldValueChanged = (id, tree, selected, checked, expanded) => {
        const storage = cloneDeep(this.state.dataStorage);
        storage[this.state.tab][id].tree = tree || storage[this.state.tab][id].tree || [];
        storage[this.state.tab][id].selected = selected || storage[this.state.tab][id].selected || [];
        storage[this.state.tab][id].checked = checked || storage[this.state.tab][id].checked || [];
        storage[this.state.tab][id].expanded = expanded || storage[this.state.tab][id].expanded || [];
        this.setState({
            dataStorage: storage
        }, () => {
            // Call onChange if defined
            this.state.data.map(item => {
                if (Array.isArray(item)) {
                    item.map(ai => {
                        if (ai.id === id && ai.onChange && typeof ai.onChange === 'function') {
                            ai.onChange(id, storage[this.state.tab][id]);
                        }
                    });
                } else if (item.id === id && item.onChange && typeof item.onChange === 'function') {
                    item.onChange(id, storage[this.state.tab][id]);
                }
            });
        });
    }

    onFileValueChanged = (id, value, flagDelete) => {
        const storage = cloneDeep(this.state.dataStorage);
        storage[this.state.tab][id] = storage[this.state.tab][id] || [];
        storage[this.state.tab][id] = flagDelete ? value : [...value.filter(item => !storage[this.state.tab][id].find(fitem => fitem.name.toLowerCase() === item.name.toLowerCase())), ...storage[this.state.tab][id]];

        this.setState({
            dataStorage: storage
        });
    }

    onTagAddition = (id, tag) => {
        const storage = cloneDeep(this.state.dataStorage);
        storage[this.state.tab][id].push(tag);
        this.setState({
            dataStorage: storage
        });
    }

    onTagDelete = (id, i) => {
        const storage = cloneDeep(this.state.dataStorage);
        storage[this.state.tab][id] = storage[this.state.tab][id].filter((item, index) => i !== index);
        this.setState({
            dataStorage: storage
        });
    }

    getFormItem = (item, cname) => {
        let itemProps;
        this.props.data.map(pi => {
            if (Array.isArray(pi)) {
                pi.map(spi => {
                    if (spi.id === item.id) {
                        itemProps = spi;
                    }
                });
            }
            if (pi.id === item.id) {
                itemProps = pi;
            }
        });
        switch (item.type) {
            case 'text':
                return (<ZText
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                />);
            case 'val':
                return (<ZVal
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    onSetValButtonClick={item.onSetValButtonClick}
                />);
            case 'datePicker':
                return (<ZDatePicker
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    locale={this.props.locale}
                    placeholder={item.placeholder || ''}
                />);
            case 'tags':
                return (<ZTags
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || []}
                    onDelete={i => this.onTagDelete(item.id, i)}
                    onAddition={tag => this.onTagAddition(item.id, tag)}
                    disabled={this.state.loading}
                    i18n={this.props.i18n}
                    suggestions={item.suggestions || []}
                    placeholderText={item.placeholderText}
                />);
            case 'data':
                return (<ZData
                    ref={input => { this.fields[item.id] = input; }}
                    i18n={this.props.i18n}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    buttons={itemProps ? itemProps.buttons : item.buttons}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    values={this.state.dataStorage[this.state.tab][item.id] || []}
                    view={item.view}
                    wrap={item.wrap}
                />);
            case 'tree':
                return (<ZTree
                    ref={input => { this.fields[item.id] = input; }}
                    i18n={this.props.i18n}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.props.i18n._(this.state.errorMessages[this.state.tab][item.id]) : null}
                    tree={this.state.dataStorage[this.state.tab][item.id].tree || []}
                    selected={this.state.dataStorage[this.state.tab][item.id].selected || []}
                    checked={this.state.dataStorage[this.state.tab][item.id].checked || []}
                    expanded={this.state.dataStorage[this.state.tab][item.id].expanded || []}
                    axios={this.props.axios}
                    UIkit={this.props.UIkit}
                    tabs={item.tabs}
                    addItemButtonLabel={item.addItemButtonLabel}
                    onAddItemButtonClick={item.onAddItemButtonClick}
                    editItemButtonLabel={item.editItemButtonLabel}
                    onEditItemButtonClick={item.onEditItemButtonClick}
                    deleteItemButtonLabel={item.deleteItemButtonLabel}
                    onDeleteItemButtonClick={item.onDeleteItemButtonClick}
                    onValueChanged={this.onTreeFieldValueChanged}
                    noItemsLabel={item.noItemsLabel}
                    draggable={item.draggable || false}
                    checkable={item.checkable || false}
                    selectable={item.selectable || false}
                />);
            case 'password':
                return (<ZText
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    type="password"
                />);
            case 'captcha':
                return (<ZCaptcha
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    source={item.source}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                />);
            case 'textarea':
                return (<ZTextarea
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    rows={item.rows}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                />);
            case 'ckeditor5':
                return (<ZCKEditor5
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    CKEditor={item.CKEditorInstance}
                    editor={item.EditorInstance}
                    languages={item.languages}
                    language={item.language}
                    imageUploadURL={item.imageUploadURL}
                    imageUploadExtras={item.imageUploadExtras}
                    axios={this.props.axios}
                />);
            case 'ckeditor4':
                return (<ZCKEditor4
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    scriptLoaded={false}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                />);
            case 'ace':
                return (<ZAce
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    lang={this.props.lang}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    imageUploadURL={item.imageUploadURL}
                    imageUploadExtras={item.imageUploadExtras}
                    imageUploadLabel={item.imageUploadLabel}
                    imageUploadErrorLabel={item.imageUploadErrorLabel}
                    axios={this.props.axios}
                    i18n={this.props.i18n}
                    UIkit={this.props.UIkit}
                />);
            case 'button':
                return (<ZButton
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    key={`field_${this.props.prefix}_${item.id}`}
                    buttonType={item.buttonType || 'button'}
                    linkTo={item.linkTo}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    disabled={this.state.loading}
                    onButtonClick={item.onButtonClick}
                />);
            case 'divider':
                return (<ZDivider
                    key={`field_${this.props.prefix}_${this.props.prefix}_${item.id}`}
                    css={item.css}
                />);
            case 'file':
                return (<ZFile
                    ref={input => { this.fields[item.id] = input; }}
                    key={`field_${this.props.prefix}_${item.id}`}
                    id={`field_${this.props.prefix}_${item.id}`}
                    originalId={item.id}
                    label={itemProps ? itemProps.label : item.label || ''}
                    value={this.state.dataStorage[this.state.tab][item.id]}
                    lang={this.props.lang}
                    onValueChanged={this.onFileValueChanged}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    UIkit={this.props.UIkit}
                />);
            case 'fileImage':
                return (<ZFileImage
                    ref={input => { this.fields[item.id] = input; }}
                    key={`field_${this.props.prefix}_${item.id}`}
                    id={`field_${this.props.prefix}_${item.id}`}
                    originalId={item.id}
                    label={itemProps ? itemProps.label : item.label || ''}
                    value={this.state.dataStorage[this.state.tab][item.id]}
                    lang={this.props.lang}
                    onValueChanged={this.onFileValueChanged}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    UIkit={this.props.UIkit}
                    allowedTypes={item.allowedTypes}
                    thumbURL={item.thumbURL}
                    thumbID={item.thumbID}
                    thumbPrefix={item.thumbPrefix}
                    thumbExtension={item.thumbExtension}
                />);
            case 'radio':
                return (<ZRadio
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || Object.keys(item.values)[0]}
                    values={item.values || {}}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    i18n={this.props.i18n}
                />);
            case 'checkbox':
                return (<ZCheckbox
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || {}}
                    values={item.values || {}}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading}
                    i18n={this.props.i18n}
                />);
            case 'select':
                return (<ZSelect
                    ref={input => { this.fields[item.id] = input; }}
                    originalId={item.id}
                    id={`field_${this.props.prefix}_${item.id}`}
                    key={`field_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    label={itemProps ? itemProps.label : item.label || ''}
                    cname={cname}
                    mandatory={this.props.validation && this.props.validation[item.id] && this.props.validation[item.id].mandatory}
                    helpText={itemProps ? itemProps.helpText : item.helpText || ''}
                    error={this.state.errors[this.state.tab] && this.state.errors[this.state.tab][item.id]}
                    errorMessage={this.state.errorMessages[this.state.tab] && this.state.errorMessages[this.state.tab][item.id] ? this.state.errorMessages[this.state.tab][item.id] : null}
                    value={this.state.dataStorage[this.state.tab][item.id] || Object.keys(item.values)[0]}
                    values={itemProps && item.updateFromProps ? itemProps.values : item.values || ''}
                    onValueChanged={this.onGenericFieldValueChanged}
                    disabled={this.state.loading || item.disabled}
                    i18n={this.props.i18n}
                />);
            case 'message':
                return (<ZMessage
                    key={`field_${this.props.prefix}_${this.props.prefix}_${item.id}`}
                    css={item.css}
                    text={itemProps && item.updateFromProps ? itemProps.text : item.text || ''}
                    i18n={this.props.i18n}
                    translate={item.translate}
                />);
            default:
                return null;
        }
    }

    getFormFields = () => {
        const data = [...this.state.data.map((item) => {
            if (Array.isArray(item)) {
                const items = item.map((ai) => this.getFormItem(ai, 'uk-width-auto uk-margin-small-right'));
                return (<ZWrap key={`field_${this.props.prefix}_wrap_${item[0].id}`} items={items} />);
            }
            return this.getFormItem(item, null);
        }), this.props.save ? (<button key="__formSubmitHiddenButton" type="submit" style={{ display: 'none' }} />) : null];
        return data;
    }

    getCommonFieldsData = id => {
        let data = this.state.dataStorage;
        if (this.props.commonFields && this.state.tab !== id) {
            data = cloneDeep(this.state.dataStorage);
            Object.values(this.props.commonFields).map(field => {
                data[id] = data[id] || {};
                data[id][field] = this.state.dataStorage[this.state.tab][field];
            });
        }
        return data;
    }

    onTabClick = e => {
        e.preventDefault();
        const { id } = e.currentTarget.dataset;
        const data = this.getCommonFieldsData(id);
        this.setState({
            tab: id,
            dataStorage: data
        }, () => {
            this.setFocusOnFields();
        });
    }

    onTabCloseClick = e => {
        e.stopPropagation();
        e.preventDefault();
        this.props.UIkit.tab(this.tabDiv).show(this.state.tabs.indexOf(this.state.tab));
        const { id } = e.currentTarget.dataset;
        const tabsNew = this.state.tabs.filter(item => item !== id);
        this.setState({
            tabs: tabsNew
        });
        if (tabsNew.length) {
            this.setState({
                tab: tabsNew[tabsNew.length - 1]
            });
        }
    }

    getTabs = () => this.state.tabs.map(tabShort => {
        const tabFull = this.props.tabs[tabShort];
        return (<li key={`${this.props.prefix}_tabitem_${tabShort}`} className={this.state.tab === tabShort ? 'uk-active' : null}>
            <a href="#" data-id={tabShort} onClick={this.onTabClick}>
                {tabFull}
                &nbsp;
                <button
                    onClick={this.onTabCloseClick}
                    type="button"
                    uk-icon="icon:close;ratio:0.8"
                    data-id={tabShort}
                />
            </a>
        </li>);
    })

    onTabsAddClick = () => {
        const tabs = Object.keys(this.props.tabs);
        this.props.UIkit.tab(this.tabDiv).show(tabs.indexOf(this.state.tab));
    }

    onRemainingTabClick = e => {
        const { id } = e.currentTarget.dataset;
        const tabsNew = [...this.state.tabs, id];
        const data = this.getCommonFieldsData(id);
        this.setState({
            tabs: tabsNew,
            tab: id,
            dataStorage: data
        }, () => {
            this.setFocusOnFields();
        });
    }

    getRemainingTabsData = () => {
        const defaultTabs = Object.keys(this.props.tabs);
        const tabs = defaultTabs.filter(tab => {
            if (this.state.tabs.indexOf(tab) === -1) {
                return true;
            }
            return false;
        });
        return tabs;
    }

    loadData = () => {
        this.setState({ loading: true }, () => {
            this.props.axios({
                method: this.props.load.method,
                url: this.props.load.url,
                responseType: 'json',
                data: { ...this.props.load.extras }
            }).then(response => {
                this.setState({ loading: false });
                if (response.data.statusCode !== 200) {
                    if (this.props.onLoadError && typeof this.props.onLoadError === 'function') {
                        this.props.onLoadError(response.data);
                    } else {
                        this.props.UIkit.notification(response.data.errorMessage || this.props.i18n._(this.props.lang.ERR_LOAD), { status: 'danger' });
                    }
                    return;
                }
                this.deserializeData(response.data.data);
                if (this.props.onLoadSuccess && typeof this.props.onLoadSuccess === 'function') {
                    this.props.onLoadSuccess(response.data);
                }
                this.setFocusOnFields();
            }).catch(e => {
                // eslint-disable-next-line no-console
                console.error(e);
                this.setState({ loading: false });
                if (this.props.onLoadError && typeof this.props.onLoadError === 'function') {
                    this.props.onLoadError(e && e.response ? e.response : null);
                } else {
                    this.props.UIkit.notification(this.props.i18n._(this.props.lang.ERR_LOAD), { status: 'danger' });
                }
            });
        });
    }

    getRemainingTabs = () => {
        const tabs = this.getRemainingTabsData();
        return tabs.map(tab => (<li key={`${this.props.prefix}_tabadd_${tab}`}><a href="#" data-id={tab} onClick={this.onRemainingTabClick}>{this.props.tabs[tab]}</a></li>));
    }

    serializeData = () => {
        const data = cloneDeep(this.state.dataStorage);
        const formData = new FormData();
        const fields = Object.keys(data[this.state.tabs[0]]);
        Object.keys(data).filter(tab => this.state.tabs.indexOf(tab) > -1).map(tab => {
            fields.map(field => {
                switch (this.types[field].type) {
                    case 'checkbox':
                        data[tab][field] = data[tab][field] || {};
                        data[tab][field] = Object.keys(data[tab][field]).map(key => data[tab][field][key] ? key : null).filter(item => item !== null);
                        break;
                    case 'tags':
                        data[tab][field] = data[tab][field] || [];
                        data[tab][field] = data[tab][field].map(item => item.id);
                        break;
                    case 'file':
                    case 'fileImage':
                        data[tab][field] = data[tab][field] || [];
                        break;
                    case 'radio':
                    case 'select':
                        data[tab][field] = data[tab][field] ? String(data[tab][field]) || String(Object.keys(this.types[field].values)[0]) : null;
                        break;
                    default:
                        data[tab][field] = data[tab][field] || '';
                }
            });
        });
        this.props.commonFields.map(item => {
            data[item] = data[this.state.tab][item];
            this.state.tabs.map(tab => {
                delete data[tab][item];
            });
        });
        Object.keys(this.props.tabs).map(tab => {
            if (this.state.tabs.indexOf(tab) === -1) {
                delete data[tab];
            }
        });
        const fileList = [];
        Object.keys(data).map(key => {
            if (this.props.tabs[key]) {
                Object.keys(data[key]).map(tkey => {
                    if (this.types[tkey].type === 'file' || this.types[tkey].type === 'fileImage') {
                        const arr = [];
                        data[key][tkey].map(file => {
                            if (fileList.indexOf(file.name) === -1 && file.lastModified) {
                                formData.append(file.name, file);
                                fileList.push(file.name);
                            }
                            arr.push({ name: file.name });
                        });
                        data[key][tkey] = arr;
                    }
                });
            } else if (this.types[key].type === 'file' || this.types[key].type === 'fileImage') {
                const arr = [];
                data[key].map(file => {
                    if (fileList.indexOf(file.name) === -1 && file.lastModified) {
                        formData.append(file.name, file);
                        fileList.push(file.name);
                    }
                    arr.push({ name: file.name });
                });
                data[key] = arr;
            }
        });
        const { formDataExtra } = this;
        formData.append('__form_data', JSON.stringify({ ...data, ...formDataExtra }));
        return { data, formData };
    }

    deserializeData = _data => new Promise(resolve => {
        const data = cloneDeep(_data);
        const dataStorageNew = {};
        const tabsNew = [];
        Object.keys(this.props.tabs).map(tab => {
            if (data[tab]) {
                dataStorageNew[tab] = {};
                const tabData = data[tab];
                Object.keys(tabData).map(field => {
                    if (this.types[field] && data[tab][field]) {
                        switch (this.types[field].type) {
                            case 'datePicker':
                                dataStorageNew[tab][field] = new Date(data[tab][field]);
                                break;
                            case 'checkbox':
                                dataStorageNew[tab][field] = {};
                                data[tab][field].map(key => {
                                    dataStorageNew[tab][field][key] = true;
                                });
                                break;
                            case 'file':
                            case 'fileImage':
                                dataStorageNew[tab][field] = data[tab][field].map(item => ({
                                    name: item.name,
                                    size: item.size
                                }));
                                break;
                            default:
                                dataStorageNew[tab][field] = data[tab][field];
                        }
                    }
                });
                this.state.data.map(item => {
                    if (Array.isArray(item)) {
                        item.map(sitem => {
                            if (!dataStorageNew[tab][sitem.id]) {
                                dataStorageNew[tab][sitem.id] = sitem.defaultValue || '';
                            }
                        });
                    } else if (!dataStorageNew[tab][item.id]) {
                        dataStorageNew[tab][item.id] = item.defaultValue || '';
                    }
                });
                if (this.props.tabs[tab]) {
                    tabsNew.push(tab);
                }
                delete data[tab];
            }
        });
        Object.keys(data).map(key => {
            tabsNew.map(tab => {
                dataStorageNew[tab] = dataStorageNew[tab] || {};
                if (this.types[key]) {
                    switch (this.types[key].type) {
                        case 'checkbox':
                            dataStorageNew[tab][key] = {};
                            data[key].map(ckey => {
                                dataStorageNew[tab][key][ckey] = true;
                            });
                            break;
                        case 'file':
                        case 'fileImage':
                            dataStorageNew[tab][key] = data[key].map(item => ({
                                name: item.name,
                                size: item.size
                            }));
                            break;
                        default:
                            dataStorageNew[tab][key] = data[key];
                    }
                }
            });
        });
        this.setState({
            tab: tabsNew[0],
            tabs: tabsNew,
            dataStorage: dataStorageNew
        }, () => {
            if (this.props.onDataDeserialized && typeof this.props.onDataDeserialized === 'function') {
                this.props.onDataDeserialized(dataStorageNew, tabsNew);
            }
            resolve(dataStorageNew);
        });
    });

    validateItem = (id, _value, data) => {
        if (!this.props.validation || !this.props.validation[id]) {
            return ERR_NONE;
        }
        const validation = this.props.validation[id];
        const value = typeof _value === 'string' ? _value.trim() : _value;
        if (validation.mandatory && !value) {
            return ERR_VMANDATORY;
        }
        if (validation.shouldMatch) {
            const fieldToMatch = data.find(i => i.id === validation.shouldMatch) || { value: '' };
            if (value !== fieldToMatch.value) {
                return ERR_VNOMATCH;
            }
        }
        if (value && validation.minLength && String(value).length < validation.minLength) {
            return ERR_VTOOSHORT;
        }
        if (value && validation.maxLength && String(value).length > validation.maxLength) {
            return ERR_VTOOLONG;
        }
        if (value && validation.regexp && typeof value === 'string') {
            const rex = new RegExp(validation.regexp);
            if (!rex.test(value)) {
                return ERR_VFORMAT;
            }
        }
        return ERR_NONE;
    }

    validateData = _data => {
        const data = [];
        Object.keys(_data).map(key => {
            if (typeof _data[key] === 'object' && Object.keys(_data[key]).length > 0) {
                Object.keys(_data[key]).map(skey => {
                    data.push({
                        id: skey,
                        value: _data[key][skey],
                        tab: key
                    });
                });
            } else if (!this.props.tabs[key]) {
                data.push({
                    id: key,
                    value: _data[key]
                });
            }
        });
        const vdata = data.map(item => {
            const res = this.validateItem(item.id, item.value, data);
            return {
                id: item.id,
                tab: item.tab || null,
                error: res
            };
        }).filter(item => item.error > ERR_NONE);
        return vdata;
    }

    hideErrors = () => new Promise(resolve => {
        const errors = {};
        const errorMessages = {};
        Object.keys(this.props.tabs).map(key => {
            errors[key] = {};
            errorMessages[key] = {};
        });
        this.setState({
            errors,
            errorMessages
        }, () => resolve());
    });

    showErrors = vdata => {
        const errorsNew = {};
        const errorMessagesNew = {};
        let focus;
        Object.keys(this.props.tabs).map(key => {
            errorsNew[key] = {};
            errorMessagesNew[key] = {};
        });
        vdata.map(item => {
            if (item.tab) {
                errorsNew[item.tab][item.id] = true;
                switch (item.error) {
                    case ERR_VMANDATORY:
                        errorMessagesNew[item.tab][item.id] = this.props.lang.ERR_VMANDATORY; // eslint-disable-line react/prop-types
                        break;
                    case ERR_VFORMAT:
                        errorMessagesNew[item.tab][item.id] = this.props.lang.ERR_VFORMAT; // eslint-disable-line react/prop-types
                        break;
                    case ERR_VNOMATCH:
                        errorMessagesNew[item.tab][item.id] = this.props.lang.ERR_VNOMATCH; // eslint-disable-line react/prop-types
                        break;
                    case ERR_VTOOSHORT:
                        errorMessagesNew[item.tab][item.id] = this.props.lang.ERR_VTOOSHORT; // eslint-disable-line react/prop-types
                        break;
                    case ERR_VTOOLONG:
                        errorMessagesNew[item.tab][item.id] = this.props.lang.ERR_VTOOLONG; // eslint-disable-line react/prop-types
                        break;
                    default:
                        errorMessagesNew[item.tab][item.id] = '';
                }
                if (!focus) {
                    focus = true;
                    this.setState({
                        tab: item.tab
                    }, () => {
                        if (this.fields[item.id].focus) {
                            this.fields[item.id].focus();
                        }
                    });
                }
            } else {
                this.state.tabs.map(tabNew => {
                    errorsNew[tabNew][item.id] = true;
                    if (!focus) {
                        focus = true;
                        this.setState({
                            tab: tabNew
                        }, () => {
                            if (this.fields[item.id].focus) {
                                this.fields[item.id].focus();
                            }
                        });
                    }
                });
            }
        });
        this.setState({
            errors: errorsNew,
            errorMessages: errorMessagesNew
        });
    }

    refreshCaptchaFields = () => {
        Object.keys(this.fields).map(f => {
            if (this.fields[f].reloadCaptcha) {
                this.fields[f].reloadCaptcha();
            }
        });
    }

    onFormSubmit = e => {
        e.preventDefault();
        if (this.props.onFormPreSubmit && typeof this.props.onFormPreSubmit === 'function') {
            this.props.onFormPreSubmit(e);
        }
        if (this.state.saving || !this.props.save || !this.props.save.url) {
            return;
        }
        this.setState({
            errors: {},
            errorMessage: null
        }, () => {
            this.setFormDataExtra(this.props.save.extras || {});
            const { data, formData } = this.serializeData();
            const vdata = this.validateData(data);
            if (vdata && vdata.length) {
                this.showErrors(vdata);
            } else {
                this.setState({ loading: true, saving: true }, () => {
                    this.props.axios.post(this.props.save.url, this.props.simple ? data.default : formData, { headers: { 'content-type': this.props.simple ? 'application/json' : 'multipart/form-data' } }).then(response => {
                        this.setState({ loading: false, saving: false });
                        if (response.data.statusCode !== 200) {
                            this.refreshCaptchaFields();
                            if (this.props.onSaveError && typeof this.props.onSaveError === 'function') {
                                this.props.onSaveError(response.data.errorMessage || this.props.lang.ERR_SAVE);
                            }
                            if (response.data.errors) {
                                const errorsSet = {};
                                const errorMessagesSet = {};
                                let tabSet = this.state.tab;
                                const tabsSet = cloneDeep(this.state.tabs);
                                Object.keys(response.data.errors).map(tab => {
                                    if (this.state.allTabs[tab]) {
                                        tabSet = tab;
                                        errorsSet[tab] = {};
                                        errorMessagesSet[tab] = {};
                                        if (this.state.tabs.indexOf(tab) === -1) {
                                            tabsSet.push(tab);
                                        }
                                        Object.keys(response.data.errors[tab]).map(id => {
                                            errorsSet[tab][id] = true;
                                            if (response.data.errors[tab][id]) {
                                                errorMessagesSet[tab][id] = response.data.errors[tab][id];
                                            }
                                        });
                                    }
                                });
                                this.setState({
                                    errors: errorsSet,
                                    errorMessages: errorMessagesSet,
                                    tabs: tabsSet,
                                    tab: tabSet,
                                    errorMessage: response.data.errorMessage || this.props.lang.ERR_SAVE
                                }, () => {
                                    const lastTab = Object.keys(response.data.errors)[Object.keys(response.data.errors).length - 1];
                                    const firstField = Object.keys(response.data.errors[lastTab])[0];
                                    if (this.state.allTabs[lastTab] && this.fields[firstField] && this.fields[firstField].focus) {
                                        this.fields[firstField].focus();
                                    }
                                });
                                return;
                            }
                        }
                        if (this.props.onSaveSuccess && typeof this.props.onSaveSuccess === 'function') {
                            this.props.onSaveSuccess(response);
                        }
                    }).catch(() => {
                        this.refreshCaptchaFields();
                        this.setState({ loading: false, saving: false });
                        this.props.UIkit.notification(this.props.i18n._(this.props.lang.ERR_SAVE), { status: 'danger' });
                    });
                });
            }
        });
    }

    render = () => (<>
        <div className="zform-wrap">
            {this.props.tabs && Object.keys(this.props.tabs).length > 1 ? <ul uk-tab="" ref={item => { this.tabDiv = item; }}>{this.getTabs()}
                <li className={this.getRemainingTabsData().length || 'uk-hidden'} ref={item => { this.tabDiv = item; }}>
                    <a href="#" onClick={this.onTabsAddClick}><span uk-icon="icon:plus;ratio:0.8" /></a>
                    <div uk-dropdown="mode:click" ref={item => { this.tabDivDropdown = item; }}>
                        <ul className="uk-nav uk-dropdown-nav">
                            {this.getRemainingTabs()}
                        </ul>
                    </div>
                </li>
            </ul> : null}
            {this.state.errorMessage ? <div className="uk-alert-danger" uk-alert="true">
                <p>{this.state.errorMessage}</p>
            </div> : null}
            {this.state.tabs.length > 0 ? <form className="zform" onSubmit={this.onFormSubmit} id={this.props.prefix} uk-margin="uk-margin">
                {this.getFormFields()}
                {this.state.loading ? <ZLoading /> : null}
            </form> : null}
        </div>
    </>)
}
