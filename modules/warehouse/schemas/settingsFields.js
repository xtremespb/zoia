((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getSettingsFields: function() {
        return {
            weight: {
                mandatoryCreate: false,
                process: function(item) {
                    return item;
                }
            },
            currency: {
                mandatoryCreate: false,
                process: function(item) {
                    return item;
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));