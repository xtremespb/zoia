((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getResetConfirmFields: function(rxp) {
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
            code: {
                mandatoryCreate: true,
                length: {
                    min: 32,
                    max: 32
                },
                type: 'string',
                regexp: /^[a-f0-9]+$/,
                process: function(item) {
                    return item.trim();
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
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));
