(() => {
    let locale;
    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/brief/${locale}.js`).done(() => {
            $('#zoiaBrief').zoiaFormBuilder({
                save: {
                    url: '/api/brief/post',
                    method: 'POST'
                },
                formDangerClass: 'za-form-danger',
                template: {
                    fields: '{fields}',
                    buttons: '{buttons}'
                },
                html: {
                    helpText: '<div class="za-text-meta">{text}</div>',
                    text: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    select: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><select class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                    captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><input class="za-input {prefix}-form-field{css} {prefix}-captcha-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}>&nbsp;<img class="{prefix}-captcha-img"><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                    buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                    button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                    launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}</div>',
                    textarea: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-form-controls"><textarea rows="{rows}" class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>'
                },
                lang: {
                    mandatoryMissing: lang['Should not be empty'],
                    tooShort: lang['Too short'],
                    tooLong: lang['Too long'],
                    invalidFormat: lang['Doesn\'t match required format'],
                    passwordsNotMatch: lang['Passwords do not match']
                },
                events: {
                    onInit: () => {},
                    onSaveSubmit: () => {},
                    onSaveValidate: () => {
                        $('#zoiaBriefSpinner').show();
                    },
                    onSaveSuccess: () => {
                        $('#zoiaBriefSpinner').hide();
                        $('#zoiaBriefSuccess').show();
                        $('#zoiaBrief').hide();
                    },
                    onSaveError: (res) => {
                        $('#zoiaBriefSpinner').hide();
                        if (res && parseInt(res.status, 10) !== -3) {
                            $('#zoiaBriefError>p').html(lang['Error while loading data from server.']).parent().show();
                            $('#zoiaBriefError')[0].scrollIntoView(true);
                        } else {
                            $('#zoiaBrief_captcha').focus();
                        }
                    }
                },
                items: {
                    title: {
                        type: 'text',
                        label: lang['Company title'],
                        css: 'za-form-width-large',
                        autofocus: true,
                        helpText: lang['Your company or project title'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 3,
                                max: 64
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    contact: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['Contact person, contact information'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['A person to contact, phone etc.'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    email: {
                        type: 'text',
                        label: lang['E-mail'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Your valid e-mail address'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 3,
                                max: 64
                            },
                            regexp: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    products: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['Products or services you provide'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['A brief information about your services or products'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    identity: {
                        type: 'select',
                        label: lang['Does your company have a logo or corporate identity?'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    slogan: {
                        type: 'text',
                        label: lang['Slogan'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Your slogan or corporate motto'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    website: {
                        type: 'select',
                        label: lang['Does your company have a website?'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    message: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['General message for your customers'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Which message is necessary to bring to the consciousness of the visitors?'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    purpose: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['Purpose(s) of the website'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Which tasks should your website solve?'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    colors: {
                        type: 'textarea',
                        label: lang['Colors'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Which colors you wish to use and why?'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    competitors: {
                        type: 'textarea',
                        rows: 5,
                        label: lang['Competitors'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['2-3 websites of your competitors'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    examples: {
                        type: 'textarea',
                        rows: 7,
                        label: lang['Website examples'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Which sites you like might be used as examples?'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    nexamples: {
                        type: 'textarea',
                        rows: 7,
                        label: lang['Negative website examples'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Which sites might NOT be used as examples?'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    hosting: {
                        type: 'select',
                        label: lang['Did you find a hoster?'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    domains: {
                        type: 'textarea',
                        label: lang['Domain name(s)'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Domain name(s) you wish to use'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    type: {
                        type: 'select',
                        label: lang['Type of your new website'],
                        css: 'za-form-width-medium',
                        autofocus: false,
                        values: {
                            0: lang.types[0],
                            1: lang.types[1],
                            2: lang.types[2],
                            3: lang.types[3],
                            4: lang.types[4],
                            5: lang.types[5],
                            6: lang.types[6]
                        },
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1|2|3|4|5|6)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    navigation: {
                        type: 'textarea',
                        rows: 7,
                        label: lang['Navigation'],
                        css: 'za-form-width-large',
                        autofocus: false,
                        helpText: lang['Planned website navigation areas'],
                        validation: {
                            mandatoryCreate: false,
                            length: {
                                min: 3,
                                max: 256
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    content: {
                        type: 'select',
                        label: lang['Website content ready'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    pcontent: {
                        type: 'select',
                        label: lang['Primary content placement'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    support: {
                        type: 'select',
                        label: lang['Production stage support'],
                        css: 'za-form-width-small',
                        autofocus: false,
                        values: { 1: lang['Yes'], 0: lang['No'] },
                        value: 0,
                        validation: {
                            mandatoryCreate: false,
                            regexp: /^(0|1)$/,
                            process: (item) => {
                                return item;
                            }
                        }
                    },
                    pages: {
                        type: 'text',
                        label: lang['Pages count (approx.)'],
                        css: 'za-form-width-medium',
                        autofocus: false,
                        helpText: lang['How many pages will be publishes (approx.)'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 1,
                                max: 32
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    budget: {
                        type: 'text',
                        label: lang['Planned budget (approx.)'],
                        css: 'za-form-width-medium',
                        autofocus: false,
                        helpText: lang['Your planned budget for your website'],
                        validation: {
                            mandatoryCreate: true,
                            length: {
                                min: 1,
                                max: 32
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        }
                    },
                    captcha: {
                        type: 'captcha',
                        label: lang.Code,
                        helpText: lang['Code you see on the picture'],
                        validation: {
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
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-margin-top',
                        buttons: [{
                            name: 'btnSave',
                            label: '<div za-spinner class="za-margin-right" id="zoiaBriefSpinner" style="display:none"></div>' + lang.Send,
                            css: 'za-button-primary',
                            type: 'submit'
                        }]
                    }
                }
            });
        });
    });
})();;