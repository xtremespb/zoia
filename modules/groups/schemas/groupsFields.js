((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getGroupsFields: function(_passwordMandatory) {
        if (_passwordMandatory === undefined) {
            _passwordMandatory = true;
        }
        return {
            groupname: {
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