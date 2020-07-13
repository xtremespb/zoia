((function(vars, global) {
    for (let i in vars) {
        global[i] = vars[i];
    }
})({
    getBriefFields: function() {
        return {
            title: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 64
                },
                process: (item) => {
                    return item.trim();
                }
            },
            contact: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            email: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 64
                },
                regexp: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                process: (item) => {
                    return item.trim();
                }
            },
            products: {
                mandatoryCreate: true,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            identity: {
                mandatoryCreate: false
            },
            slogan: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            website: {
                mandatoryCreate: false,
                regexp: /^(0|1)$/
            },
            message: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            purpose: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            colors: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            competitors: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            examples: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            nexamples: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            hosting: {
                mandatoryCreate: false,
                regexp: /^(0|1)$/
            },
            domains: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            type: {
                mandatoryCreate: false,
                regexp: /^(0|1|2|3|4|5|6)$/
            },
            navigation: {
                mandatoryCreate: false,
                length: {
                    min: 3,
                    max: 256
                },
                process: (item) => {
                    return item.trim();
                }
            },
            content: {
                mandatoryCreate: false,
                regexp: /^(0|1)$/
            },
            pcontent: {
                mandatoryCreate: false,
                regexp: /^(0|1)$/
            },
            support: {
                mandatoryCreate: false,
                regexp: /^(0|1)$/,
                process: (item) => {
                    return item.trim();
                }
            },
            pages: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 32
                },
                process: (item) => {
                    return item.trim();
                }
            },
            budget: {
                mandatoryCreate: true,
                length: {
                    min: 1,
                    max: 32
                },
                process: (item) => {
                    return item.trim();
                }
            },
            captcha: {
                mandatoryCreate: true,
                length: {
                    min: 4,
                    max: 4
                },
                regexp: /^[0-9]+$/,
                process: (item) => {
                    return item.trim();
                }
            }
        };
    }
}, typeof exports === 'undefined' ? this : exports));