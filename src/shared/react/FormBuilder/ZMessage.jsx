/* eslint react/prop-types:0 */

import React from 'react';

export default props => (<div className={`uk-margin-top uk-margin-bottom ${props.css || ''}`}>{props.translate === false ? props.text : props.i18n._(props.text)}</div>);
