((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getFeedbackFields: function() {
        return {
            name: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 64
                },
                type: 'string',
                process: function(item) {
                    return item.trim().replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;').replace(/\n/gm, '<br>');
                }
            },
            email: {
                mandatoryCreate: false,
                length: {
                    min: 6,
                    max: 129
                },
                regexp: /^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/,
                type: 'string',
                process: function(item) {
                    return item.trim();
                }
            },
            phone: {
                mandatoryCreate: false,
                regexp: /^[0-9\+\-\s\(\)]+$/,
                length: {
                    min: 6,
                    max: 64
                },
                type: 'string',
                process: function(item) {
                    return item.trim();
                }
            },
            message: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 4096
                },
                type: 'string',
                process: function(item) {
                    return item.trim().replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;').replace(/\n/gm, '<br>');
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