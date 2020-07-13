((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getReviewsFields: function(_passwordMandatory) {
        if (_passwordMandatory === undefined) {
            _passwordMandatory = true;
        }
        return {
            name: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 60
                },
                type: 'string',
                regexp: /^[^<>'\"/;`%]*$/,
                process: function(item) {
                    return item.trim();
                }
            },
            text: {
                mandatoryCreate: true,
                mandatoryEdit: true,
                length: {
                    min: 1,
                    max: 2048
                },
                process: (item) => {
                    return item.trim();
                }
            },
            status: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 1
                },
                type: 'string',
                regexp: /^(0|1)$/
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));