import axios from 'axios';
import cookies from 'zoia-cookies';
import {
    APP_DATA_RUNTIME_SET_TOKEN,
    APP_DATA_SET_USER
} from '../constants/core';

export default (token, config) => dispatch => {
    axios.post(`${config.api.url}/api/users/logout`, {
        token
    }).then(res => {
        if (res.data.statusCode === 200) {
            dispatch({
                type: APP_DATA_RUNTIME_SET_TOKEN,
                payload: null
            });
            dispatch({
                type: APP_DATA_SET_USER,
                payload: {}
            });
            cookies.expire(`${config.id}_auth`, undefined, config.cookieOptions);
            window.location.href = '/';
        }
    }).catch(() => {
        window.location.href = '/';
    });
};
