import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ZTablePagination from './ZPagination.jsx';
import ZTh from './ZTh.jsx';
import ZSearch from './ZSearch.jsx';
import ZLoading from './ZLoading.jsx';
import './style.css';

const ERR_NONE = 0;
const ERR_VMANDATORY = 1;
const ERR_VFORMAT = 2;

export default class ZTable extends Component {
    state = {
        data: [],
        columns: [],
        page: 1,
        checkboxes: {},
        checkboxAllChecked: false,
        currentChunk: [],
        searchText: '',
        total: 0,
        editMode: {
            columnId: null,
            recordId: null,
            value: null,
            loading: false
        },
        values: {},
        currentSearchInputValue: '',
        validationError: ERR_NONE,
        mounted: false
    }

    static propTypes = {
        prefix: PropTypes.string.isRequired,
        columns: PropTypes.arrayOf(PropTypes.object).isRequired,
        lang: PropTypes.objectOf(PropTypes.string),
        itemsPerPage: PropTypes.number.isRequired,
        source: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        save: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        data: PropTypes.arrayOf(PropTypes.object),
        sortColumn: PropTypes.string,
        sortDirection: PropTypes.string,
        hideColumnID: PropTypes.bool,
        UIkit: PropTypes.func.isRequired,
        axios: PropTypes.func.isRequired,
        onLoadError: PropTypes.func,
        onSaveError: PropTypes.func,
        i18n: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]).isRequired,
        initialState: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        onStateUpdated: PropTypes.func
    }

    static defaultProps = {
        hideColumnID: false,
        sortDirection: 'asc',
        sortColumn: '',
        data: [],
        source: {},
        save: {},
        lang: {
            LOADING: 'Loading data, please wait…',
            NO_RECORDS: 'No records to display',
            ERROR_LOAD: 'Could not load data',
            ERROR_SAVE: 'Could not save data',
            ERR_VMANDATORY: 'Field is required',
            ERR_VFORMAT: 'Invalid format'
        },
        onLoadError: null,
        onSaveError: null,
        initialState: null,
        onStateUpdated: null
    }

    constructor(props) {
        super(props);
        this.usersTableSearchField = React.createRef();
        if (!this.props.initialState || !Object.keys(this.props.initialState).length || this.props.initialState.loading) {
            this.state.columns = props.columns;
            this.props.columns.map(c => {
                const cn = c;
                cn.sort = this.props.sortColumn === cn.id ? this.props.sortDirection : null;
                this.state.values[c.id] = {};
            });
            if (props.source.url) {
                this.fetchURL(true);
            } else {
                this.state.data = props.data;
                this.state.total = props.data.length;
                const currentColumn = this.state.columns.find(element => !!element.sort);
                if (currentColumn) {
                    const dataSorted = this.state.data.slice(0);
                    dataSorted.sort((a, b) => (a[currentColumn.id] > b[currentColumn.id]) ? (currentColumn.sort === 'desc' ? -1 : 1) : ((b[currentColumn.id] > a[currentColumn.id]) ? (currentColumn.sort === 'desc' ? 1 : -1) : 0));
                }
                this.setValuesFromData(this.state.data, true);
            }
        }
    }

    componentDidMount = () => {        
        document.addEventListener('keydown', this.onEditModeEscapeBinding);
        if (this.props.initialState && !this.props.initialState.loading && Object.keys(this.props.initialState).length) {
            this.setState({
                ...this.props.initialState,
                loading: false,
                loadingText: false
            }, () => {
                if (this.props.initialState.searchText) {
                    this.usersTableSearchField.current.setValue(this.props.initialState.searchText);
                }
                const columns = this.props.initialState.columns.map((c, i) => {
                    const column = c;
                    column.process = this.props.columns[i].process;
                    return column;
                });
                this.setState({
                    columns
                });
                this.mounted = true;
            });
        } else {
            this.mounted = true;
        }
    }

    componentWillUnmount = () => {
        this.mounted = false;
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (this.mounted && prevState !== this.state && this.props.onStateUpdated && typeof this.props.onStateUpdated === 'function') {
            this.props.onStateUpdated(this.state);
        }
    }

    setLoading = flag => {
        if (this.mounted) {
            this.setState({
                loading: flag
            });
        }
    }

    setValuesFromData = (data, callFromConstructor) => {
        const currentChunk = this.props.source.url && data.length > this.props.itemsPerPage ? data.slice((this.state.page - 1) * this.props.itemsPerPage, (this.state.page - 1) * this.props.itemsPerPage + parseInt(this.props.itemsPerPage, 10)) : data;
        const valuesSet = {};
        currentChunk.map((item) => {
            this.state.columns.map((col) => {
                let val = item[col.id] || ' ';
                val = col.process && typeof col.process === 'function' ? col.process(item[col.id], item) : val;
                valuesSet[col.id] = valuesSet[col.id] || {};
                valuesSet[col.id][item._id] = val;
            });
        });
        if (callFromConstructor) {
            this.state.values = valuesSet;
        } else if (this.mounted) {
            this.setState({
                values: valuesSet
            });
        }
    }

    reloadURL = () => {
        this.fetchURL(false, {
            page: this.props.initialState.page,
            searchText: this.props.initialState.searchText,
            sortColumn: this.props.initialState.sortColumn,
            sortDirection: this.props.initialState.sortDirection
        });
    }

    fetchURL(init, data = {}) {
        if (init) {
            this.state.loading = true;
            this.state.loadingText = true;
        } else if (this.mounted) {
            this.setState({
                loading: true
            });
        }
        const paramsData = {
            ...this.props.source.extras,
            page: data.page || this.state.page,
            search: data.searchText || this.state.searchText,
            itemsPerPage: this.props.itemsPerPage,
            sortColumn: data.sortColumn || this.state.sortColumn || this.props.sortColumn || '',
            sortDirection: data.sortDirection || this.state.sortDirection || this.props.sortDirection || ''
        };
        this.props.axios({
            method: this.props.source.method,
            url: this.props.source.url,
            responseType: 'json',
            data: paramsData,
            params: this.props.source.method.match(/get/i) ? paramsData : null
        }).then(response => {
            if (response.data.statusCode !== 200 && this.mounted) {
                this.setState({
                    error: true,
                    loading: false,
                    loadingText: false,
                    data: []
                }, () => {
                    if (this.props.onLoadError && typeof this.props.onLoadError === 'function') {
                        this.props.onLoadError(response.data);
                    }
                });
                return;
            }
            if (this.mounted) {
                this.setState({
                    data: response.data.items,
                    total: response.data.total,
                    loading: false,
                    loadingText: false,
                    error: false
                }, () => {
                    if (response.data.items.length) {
                        // This is a workaround to fix language switch behaviour
                        window.scrollTo(0, 1);
                    } else if (this.state.page !== 1 && this.mounted) {
                        this.setState({
                            page: 1
                        }, () => {
                            this.fetchURL(false);
                        });
                    }
                });
            }
            this.setValuesFromData(response.data.items);
        }).catch(e => {
            if (this.mounted) {
                this.setState({
                    error: true,
                    loading: false,
                    loadingText: false,
                    data: []
                }, () => this.props.onLoadError(e && e.response ? e.response : {}));
            }
        });
    }

    saveData(_columnId, _recordId, _value) {
        const paramsData = {
            ...this.props.source.extras,
            columnId: _columnId,
            recordId: _recordId,
            value: _value
        };
        this.props.axios({
            method: this.props.save.method,
            url: this.props.save.url,
            responseType: 'json',
            data: paramsData,
            params: this.props.save.method.match(/get/i) ? paramsData : null
        }).then(response => {
            if (response.data.statusCode !== 200) {
                if (this.props.onSaveError && typeof this.props.onSaveError === 'function') {
                    this.props.onSaveError(response.data);
                } else {
                    this.props.UIkit.notification(response.data.errorMessage || this.props.lang.ERROR_SAVE, { status: 'danger' });
                }
                if (this.mounted) {
                    this.setState({
                        editMode: {
                            columnId: null,
                            recordId: null,
                            value: null,
                            loading: false
                        }
                    });
                }
                return;
            }
            const valuesNew = JSON.parse(JSON.stringify(this.state.values));
            valuesNew[this.state.editMode.columnId][this.state.editMode.recordId] = response.data.value;
            if (this.mounted) {
                this.setState({
                    editMode: {
                        columnId: null,
                        recordId: null,
                        value: null,
                        loading: false
                    },
                    values: valuesNew
                });
            }
        }).catch(e => {
            if (this.props.onSaveError && typeof this.props.onSaveError === 'function') {
                this.props.onSaveError(null, e);
            } else {
                this.props.UIkit.notification(this.props.lang.ERROR_SAVE, { status: 'danger' });
            }
            if (this.mounted) {
                this.setState({
                    editMode: {
                        columnId: null,
                        recordId: null,
                        value: null,
                        loading: false
                    }
                });
            }
        });
    }

    onCellValueClick = (event, val) => {
        const col = JSON.parse(event.currentTarget.dataset.col);
        if (!col.editable) {
            return;
        }
        const item = JSON.parse(event.currentTarget.dataset.item);
        if (this.mounted) {
            this.setState({
                editMode: {
                    columnId: col.id,
                    recordId: item._id,
                    value: val,
                    loading: false
                },
                validationError: ERR_NONE
            }, () => {
                this[`editField_${col.id}_${item._id}`].focus();
            });
        }
    }

    onEditModeInputBlur = () => {
        if (this.mounted) {
            this.setState({
                editMode: {
                    columnId: null,
                    recordId: null
                }
            });
        }
    }

    onEditModeInputKeypress = (event, col) => {
        if (event.key === 'Enter') {
            this.state.editMode.value = this.state.editMode.value.trim();
            if (col.validation) {
                if (col.validation.mandatory && !this.state.editMode.value && this.mounted) {
                    this.setState({
                        validationError: ERR_VMANDATORY
                    });
                    return;
                }
                if (col.validation.regexp && this.state.editMode.value) {
                    const rex = new RegExp(col.validation.regexp);
                    if (!rex.test(this.state.editMode.value)) {
                        if (this.mounted) {
                            this.setState({
                                validationError: ERR_VFORMAT
                            });
                        }
                        return;
                    }
                }
            }
            if (this.mounted) {
                this.setState({
                    editMode: {
                        columnId: this.state.editMode.columnId,
                        recordId: this.state.editMode.recordId,
                        value: this.state.editMode.value,
                        loading: true
                    }
                }, () => {
                    this.saveData(this.state.editMode.columnId, this.state.editMode.recordId, this.state.editMode.value);
                });
            }
        }
    }

    onEditModeInputChange = event => {
        const { value } = event.target;
        const editModeNew = JSON.parse(JSON.stringify(this.state.editMode));
        editModeNew.value = value;
        if (this.mounted) {
            this.setState({
                editMode: editModeNew
            });
        }
    }

    onEditModeSelectChange = event => {
        const { value } = event.target;
        if (this.mounted) {
            this.setState({
                editMode: {
                    columnId: this.state.editMode.columnId,
                    recordId: this.state.editMode.recordId,
                    value: value, // eslint-disable-line object-shorthand
                    loading: true
                }
            }, () => {
                this.saveData(this.state.editMode.columnId, this.state.editMode.recordId, this.state.editMode.value);
            });
        }
    }

    onEditModeEscapeBinding = event => {
        if (this.mounted && event.key === 'Escape' && this.state.editMode.columnId) {
            this.setState({
                editMode: {
                    columnId: null,
                    recordId: null,
                    value: null,
                    loading: false
                }
            });
        }
    }

    onEditModeSelectKeypress = event => {
        if (event.key === 'Enter') {
            this.onEditModeSelectChange(event);
        }
    }

    getEditableFieldsErrorMessage = code => {
        let msg;
        switch (code) {
            case ERR_VFORMAT:
                msg = this.props.lang.ERR_VFORMAT;
                break;
            default:
                msg = this.props.lang.ERR_VMANDATORY;
        }
        return this.state.validationError !== ERR_NONE ? <div><span className="uk-label uk-label-danger">{msg}</span></div> : null;
    }

    getEditableFields = (col, item) => {
        switch (col.editable) {
            case 'select':
                return (<select onKeyPress={this.onEditModeSelectKeypress} onChange={this.onEditModeSelectChange} value={this.state.values[col.id][item._id]} onBlur={this.onEditModeInputBlur} className="uk-select ztable-editmode-select uk-width-1-1" ref={input => { this[`editField_${col.id}_${item._id}`] = input; }}>{Object.keys(col.options).map(key => (<option key={`editSelectOption_${col.id}_${item._id}_${key}`} value={key}>{this.props.i18n._(col.options[key])}</option>))}</select>);
            default:
                return (<><input ref={input => { this[`editField_${col.id}_${item._id}`] = input; }} type="text" className={`uk-input ztable-editmode-input uk-width-1-1${this.state.validationError !== ERR_NONE ? ' uk-form-danger' : null}`} onChange={this.onEditModeInputChange} value={this.state.editMode.value} onKeyPress={e => this.onEditModeInputKeypress(e, col)} onBlur={this.onEditModeInputBlur} />{this.getEditableFieldsErrorMessage(this.state.validationError)}</>);
        }
    }

    getCell = (col, item, val) => {
        const value = col.editable ? (col.editable === 'select' ? this.props.i18n._(col.options[this.state.values[col.id] ? this.state.values[col.id][item._id] : '']) : this.state.values[col.id] ? this.state.values[col.id][item._id] : '') : val;
        return (<>{this.state.editMode.loading && this.state.editMode.columnId === col.id && this.state.editMode.recordId === item._id ? <div uk-spinner="ratio:0.5" /> : <div className="ztable-cell" tabIndex={col.editable ? 0 : null} onClick={e => this.onCellValueClick(e, this.state.values[col.id] ? this.state.values[col.id][item._id] : null)} data-col={JSON.stringify(col)} data-item={JSON.stringify(item)} role={col.editable ? 'button' : null}>{value || ' '}</div>}</>); // eslint-disable-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-static-element-interactions
    }

    getRows = () => {
        this.state.currentChunk = this.state.data.length > this.props.itemsPerPage ? this.state.data.slice((this.state.page - 1) * this.props.itemsPerPage, (this.state.page - 1) * this.props.itemsPerPage + parseInt(this.props.itemsPerPage, 10)) : this.state.data;
        return this.state.currentChunk.length ? this.state.currentChunk.map((item) => {
            const cells = this.state.columns.map((col) => {
                let val = item[col.id] || ' ';
                val = col.process && typeof col.process === 'function' ? col.process(item[col.id], item) : val;
                return (<td key={`${this.props.prefix}_td_${col.id}`} className={col.cssRow || null}>{!this.state.editMode.loading && this.state.editMode.columnId === col.id && this.state.editMode.recordId === item._id ? this.getEditableFields(col, item) : this.getCell(col, item, val)}</td>);
            });
            const columnID = this.props.hideColumnID ? null : <td className="uk-table-shrink"><input onChange={this.checkboxChangeHandler} className="uk-checkbox" type="checkbox" data-id={item._id} checked={!!this.state.checkboxes[item._id]} /></td>;
            return (<tr key={`${this.props.prefix}_tr_${item._id}`}>{columnID}{cells}</tr>);
        }) : false;
    }

    checkboxChangeHandler = event => {
        const id = event.currentTarget.getAttribute('data-id');
        const { checkboxes } = this.state;
        checkboxes[id] = checkboxes[id] ? null : this.state.currentChunk.find(i => String(i._id) === id);
        Object.keys(checkboxes).map(key => {
            if (!checkboxes[key]) {
                delete checkboxes[key];
            }
        });
        if (this.mounted) {
            this.setState({
                checkboxes: checkboxes // eslint-disable-line object-shorthand
            });
        }
        this.getCheckboxData();
    }

    checkboxChangeAllHandler = event => {
        const checkboxesNew = {};
        this.state.currentChunk.map(item => checkboxesNew[item._id] = event.currentTarget.checked ? item : null);
        Object.keys(checkboxesNew).map(key => {
            if (!checkboxesNew[key]) {
                delete checkboxesNew[key];
            }
        });
        if (this.mounted) {
            this.setState({
                checkboxes: checkboxesNew,
                checkboxAllChecked: event.currentTarget.checked
            });
        }
        this.getCheckboxData();
    }

    getCheckboxData = () => {
        const data = Object.keys(this.state.checkboxes).map(key => this.state.checkboxes[key]);
        Object.keys(this.state.values).map(key => {
            data.map((item, i) => {
                data[i][key] = this.state.values[key][item._id] || data[i][key];
            });
        });
        return data;
    }

    getCurrentData = () => this.state.values;

    pageClickHandler = (pageNew = this.state.page) => {
        if (this.mounted) {
            this.setState({
                page: pageNew,
                checkboxes: {},
                checkboxAllChecked: false
            }, () => {
                if (this.props.source.url) {
                    this.fetchURL(false);
                }
            });
        }
    }

    thOnClickHandler = event => {
        const id = event.currentTarget.getAttribute('data-id');
        const currentColumn = this.state.columns.find((element) => !!element.sort);
        const clickedColumn = this.state.columns.find((element) => element.id === id);
        if (!clickedColumn.sortable) {
            return;
        }
        let sortDirectionNew;
        const columnsNew = clickedColumn.id === currentColumn.id ? this.state.columns.map(_item => {
            const item = _item;
            item.sort = item.id === currentColumn.id ? item.sort === 'desc' ? 'asc' : 'desc' : item.sort;
            sortDirectionNew = sortDirectionNew || item.sort;
            return item;
        }) : this.state.columns.map(_item => {
            const item = _item;
            item.sort = item.id === clickedColumn.id ? 'desc' : null;
            sortDirectionNew = sortDirectionNew || item.sort;
            return item;
        });
        if (this.mounted && this.props.source.url) {
            this.setState({
                sortColumn: id,
                sortDirection: sortDirectionNew
            }, () => {
                this.fetchURL(false);
            });
        } else {
            const dataSorted = this.state.data.slice(0);
            dataSorted.sort((a, b) => (a[clickedColumn.id] > b[clickedColumn.id]) ? (sortDirectionNew === 'desc' ? -1 : 1) : ((b[clickedColumn.id] > a[clickedColumn.id]) ? (sortDirectionNew === 'desc' ? 1 : -1) : 0));
            if (this.mounted) {
                this.setState({
                    columns: columnsNew,
                    data: dataSorted
                });
            }
        }
    }

    onSearchValueChanged = value => {
        if (this.mounted && this.props.source.url) {
            this.setState({
                searchText: value.trim(),
                currentSearchInputValue: value.trim(),
                data: [],
                loadingText: true,
                page: 1
            }, () => {
                this.fetchURL(false);
            });
        } else {
            const dataFiltered = value.length > 0 ? this.props.data.filter(item => {
                const values = Object.values(item);
                return values.find(val => String(val).match(new RegExp(value, 'gim')));
            }) : this.props.data.slice(0);
            if (this.mounted) {
                this.setState({
                    searchText: value.trim(),
                    currentSearchInputValue: value.trim(),
                    data: dataFiltered,
                    total: dataFiltered.length,
                    page: 1
                });
            }
        }
    }

    onClickRefreshHandler = e => {
        e.preventDefault();
        if (this.mounted) {
            this.setState({
                error: false,
                loadingText: true
            });
        }
        this.fetchURL(false);
    }

    render = () => (<div className="ztable-wrap">
        <div uk-grid="true">
            <div className="uk-width-expand@s">
                {this.props.topButtons || null}
            </div>
            <div className="uk-width-auto@s">
                <ZSearch ref={this.usersTableSearchField} currentSearchInputValue={this.state.currentSearchInputValue} onValueChanged={this.onSearchValueChanged} />
            </div>
        </div>
        <ZTablePagination page={this.state.page} totalPages={Math.ceil(this.state.total / this.props.itemsPerPage)} pageClickHandler={this.pageClickHandler} />
        <div className="uk-overflow-auto">
            <table className="uk-table uk-table-middle uk-table-small uk-table-striped uk-table-hover">
                <thead>
                    <tr>
                        {this.props.hideColumnID ? null : <th className="uk-table-shrink"><label><input type="checkbox" className="uk-checkbox" checked={this.state.checkboxAllChecked} onChange={this.checkboxChangeAllHandler} /></label></th>}
                        {this.state.columns.map(item => (<ZTh key={item.id} prefix={this.props.prefix} css={item.cssHeader} thid={item.id} title={this.props.i18n._(item.title)} sortable={item.sortable} sort={item.sort} thOnClickHandler={this.thOnClickHandler} />))}
                    </tr>
                </thead>
                <tbody>
                    {this.state.loadingText ? <tr><td colSpan="100%">{this.props.lang.LOADING}</td></tr> : this.state.error ? null : this.getRows() || <tr><td colSpan="100%">{this.props.lang.NO_RECORDS}</td></tr>}
                    {this.state.error ? <tr><td colSpan="100%" className="ztable-td-error">{this.props.lang.ERROR_LOAD}&nbsp;<button type="button" onClick={this.onClickRefreshHandler} uk-icon="icon:refresh;ratio:0.8" /></td></tr> : null}
                </tbody>
            </table>
        </div>
        <div uk-grid="true" className="uk-margin-top">
            <div className="uk-width-expand@s">
                <ZTablePagination page={this.state.page} totalPages={Math.ceil(this.state.total / this.props.itemsPerPage)} pageClickHandler={this.pageClickHandler} />
            </div>
        </div>
        {this.state.loading ? <ZLoading /> : null}
    </div>);
}
