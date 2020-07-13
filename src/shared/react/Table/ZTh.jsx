/* eslint react/prop-types:0 */

import React from 'react';

export default props => (<th className={`uk-text-nowrap ztable-th${props.sortable ? ' ztable-th-sortable' : ''} ${props.prefix}-th ${props.css || ''}`} data-id={props.thid} onClick={props.thOnClickHandler}>{props.title}{props.sortable ? <span>&nbsp;<span uk-icon={`triangle-${props.sort === 'desc' ? 'up' : 'down'}`} style={props.sort ? { opacity: '1' } : { opacity: '0' }} /></span> : null}</th>);
