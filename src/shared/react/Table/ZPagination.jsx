/* eslint react/prop-types:0 */

import React, { Component } from 'react';

export default class ZTablePagination extends Component {
    handleChange = event => {
        event.preventDefault();
        const page = parseInt(event.currentTarget.getAttribute('data-page'), 10);
        // eslint-disable-next-line no-console
        this.props.pageClickHandler && typeof this.props.pageClickHandler === 'function' ? this.props.pageClickHandler(page) : console.log('No handleChange() for Pagination component is set');
    }

    generatePaginationRange = () => {
        const delta = 2;
        if (this.props.totalPages <= 1) {
            return '';
        }
        const range = [];
        for (let i = Math.max(2, this.props.page - delta); i <= Math.min(this.props.totalPages - 1, this.props.page + delta); i += 1) {
            this.props.page === i ? range.push(<li className="uk-active ztable-page-active" key={`page_${i}`}>{i}</li>) : range.push(<li key={`page_${i}`}><a onClick={this.handleChange} data-page={i} href="#">{i}</a></li>);
        }
        if (this.props.page - delta > 2) {
            range.unshift(<li key="page_dots1">...</li>);
        }
        if (this.props.page + delta < this.props.totalPages - 1) {
            range.push(<li key="page_dots2">...</li>);
        }
        (this.props.page === 1) ? range.unshift(<li className="uk-active ztable-page-active" key="page_1">1</li>) : range.unshift(<li key="page_1"><a onClick={this.handleChange} data-page="1" href="#">1</a></li>);
        range.push(this.props.page === this.props.totalPages ? <li className="uk-active ztable-page-active" key={`page_${this.props.totalPages}`}>{this.props.totalPages}</li> : <li key={`page_${this.props.totalPages}`}><a href="#" onClick={this.handleChange} data-page={this.props.totalPages}>{this.props.totalPages}</a></li>);

        return range;
    }

    render = () => <ul className="uk-pagination ztable-noselect" uk-margin="uk-margin">
        {this.generatePaginationRange()}
    </ul>;
}
