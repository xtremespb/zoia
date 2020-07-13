/* eslint react/prop-types:0 react/no-this-in-sfc:0 */

import React, { Component } from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import MomentLocaleUtils, {
    formatDate,
    parseDate,
} from 'react-day-picker/moment';
import 'react-day-picker/lib/style.css';

export default class ZDatePicker extends Component {
    constructor(props) {
        super(props);
        this.field = React.createRef();
    }

    dateInputField = React.forwardRef((props, ref) => (<input
        ref={ref}
        type="text"
        className={`uk-input${this.props.error ? ' uk-form-danger' : ''}${this.props.css ? ` ${this.props.css}` : ''}`}
        disabled={this.props.disabled}
        {...props}
    />))

    focus = () => this.field.current.input.focus()

    handleDayChange = (selectedDay) => {
        if (this.props.onValueChanged && typeof this.props.onValueChanged === 'function') {
            this.props.onValueChanged(this.props.originalId, selectedDay);
        }
    }

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <DayPickerInput
                ref={this.field}
                formatDate={formatDate}
                parseDate={parseDate}
                format="LL"
                placeholder={this.props.placeholder}
                dayPickerProps={{
                    locale: this.props.locale || 'en',
                    localeUtils: MomentLocaleUtils,
                }}
                value={this.props.value}
                component={this.dateInputField}
                onDayChange={this.handleDayChange}
            />
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>)
}
