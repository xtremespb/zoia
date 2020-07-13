((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getNewAccountFields: function() {
        return {
            id: {
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
            months: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 2
                },
                regexp: /^(1|2|3|4|5|6|7|8|9|10|11|12)$/,
                process: (item) => {
                    return item.trim();
                }
            },
            password: {
                mandatoryCreate: true,
                length: {
                    min: 5,
                    max: 50
                },
                type: 'string',
                process: function(item) {
                    return item.trim();
                }
            },
            preset: {
                mandatoryCreate: true,
                type: 'string',
                process: function(item) {
                    return item.trim().toLowerCase();
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));