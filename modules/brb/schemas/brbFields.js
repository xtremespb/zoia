((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getUsersFields: function() {
        return {
            portfolioid: {
                mandatoryCreate: false,
                length: {
                    min: 1,
                    max: 10
                },
                type: 'string',
                regexp: /^[0-9]{1,10}$/,
                process: function(item) {
                    return item.trim();
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));