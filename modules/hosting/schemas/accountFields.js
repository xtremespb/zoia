((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getAccountFields: function() {
        return {
            account: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 20
                },
                type: 'string',
                regexp: /^[A-Za-z0-9_\-]+$/,
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            },
            days: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 5
                },
                regexp: /^[0-9]+$/,
                process: (item) => {
                    return item.trim();
                }
            },
            host: {
                mandatoryCreate: true,
                type: 'string',
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            },
            preset: {
                mandatoryCreate: true,
                type: 'string',
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            },
            plugin: {
                mandatoryCreate: true,
                type: 'string',
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));