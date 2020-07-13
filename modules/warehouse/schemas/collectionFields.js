((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getCollectionFields: function() {
        return {
            title: {
                mandatoryCreate: false,
                process: function(item) {
                    return item;
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));