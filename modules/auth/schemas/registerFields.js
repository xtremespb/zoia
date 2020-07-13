((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getRegisterFields: function(rxp) {
        return {
            username: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 20
                },
                type: 'string',
                regexp: rxp.username,
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            },
            email: {
                mandatoryCreate: true,
                length: {
                    min: 6,
                    max: 129
                },
                type: 'string',
                regexp: /^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/,
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            },
            password: {
                mandatoryCreate: true,
                length: {
                    min: 8,
                    max: 50
                },
                type: 'string',
                process: function(item) {
                    return item.trim();
                }
            },
            captcha: {
                mandatoryCreate: true,
                length: {
                    min: 4,
                    max: 4
                },
                regexp: /^[0-9]+$/,
                process: function(item) {
                    return item.trim();
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));