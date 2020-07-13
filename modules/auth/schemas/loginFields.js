((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getLoginFields: function(rxp) {
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
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));