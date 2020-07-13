((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getVariantFields: function() {
        return {
            pid: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 64
                },
                type: 'string',
                regexp: /^[A-Za-z0-9_\-]+$/,
                process: function(item) {
                    return item.trim();
                }
            },
            title: {
                mandatoryCreate: false,
                process: function(item) {
                    return item;
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));