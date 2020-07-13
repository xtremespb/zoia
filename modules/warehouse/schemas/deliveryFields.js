((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getDeliveryFields: function() {
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
            },
            cost: {
                mandatoryCreate: false,
                mandatoryEdit: false,
                length: {
                    min: 1,
                    max: 64
                },
                regexp: /^\d+(\.\d+)?$/,
                process: (item) => {
                    return item.trim();
                }
            },
            cost_weight: {
                mandatoryCreate: false,
                mandatoryEdit: false,
                length: {
                    min: 1,
                    max: 64
                },
                regexp: /^\d+(\.\d+)?$/,
                process: (item) => {
                    return item.trim();
                }
            },
            delivery: {
                mandatoryCreate: true,
                mandatoryEdit: true,
                regexp: /^(delivery|pickup)$/
            },
            status: {
                mandatoryCreate: true,
                mandatoryEdit: true,
                length: {
                    min: 1,
                    max: 1
                },
                regexp: /^(0|1|2)$/
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));