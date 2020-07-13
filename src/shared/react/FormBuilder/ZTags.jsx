/* eslint react/prop-types:0 */

import React, { Component } from 'react';
import ReactTags from 'react-tag-autocomplete';

export default class ZTags extends Component {
    focus = () => this.field.focus()

    render = () => (<div className={this.props.cname}>
        <label className="uk-form-label" htmlFor={this.props.id}>{this.props.label}{this.props.mandatory ? <span className="zform-mandatory">*</span> : null}</label>
        <div className="uk-form-controls">
            <ReactTags
                tags={this.props.value}
                suggestions={this.props.suggestions}
                onDelete={this.props.onDelete}
                onAddition={this.props.onAddition}
                placeholderText={this.props.placeholderText}
                classNames={{
                    root: 'zform-react-tags',
                    rootFocused: 'is-focused',
                    selected: 'zform-react-tags__selected',
                    selectedTag: 'zform-react-tags__selected-tag',
                    selectedTagName: 'zform-react-tags__selected-tag-name',
                    search: 'zform-react-tags__search',
                    searchWrapper: 'zform-react-tags__search-wrapper',
                    searchInput: 'zform-react-tags__search-input',
                    suggestions: 'zform-react-tags__suggestions',
                    suggestionActive: 'is-active',
                    suggestionDisabled: 'is-disabled'
                }}
            />
            {this.props.error && this.props.errorMessage ? <div><span className="uk-label uk-label-danger">{this.props.errorMessage}</span></div> : null}
            {this.props.helpText ? <div className="uk-text-small uk-text-muted">{this.props.helpText}</div> : null}
        </div>
    </div>);
}
