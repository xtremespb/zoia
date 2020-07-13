/* eslint no-extra-semi: 0 */
/* eslint max-len: 0 */
/* eslint default-case: 0 */
/* eslint no-undef: 0 */
/*! zoiaFormBuilder v1.0.5 | (c) Michael A. Matveev | github.com/xtremespb/zoiaFormBuilder 
 */
;
(($) => {
    'use strict';

    const pluginName = 'zoiaFormBuilder';
    let defaults = {
        load: {
            url: '#',
            method: 'POST'
        },
        save: {
            url: '#',
            method: 'POST'
        },
        captcha: '/api/captcha',
        items: [],
        edit: false,
        validation: true,
        html: {
            helpText: '<div class="uk-text-meta">{text}</div>',
            text: '<div class="uk-margin-bottom"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><br><div class="uk-form-controls"><input class="uk-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="uk-label-danger"></span></div>{helpText}</div></div>',
            select: '<div class="uk-margin-bottom"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><br><select{multiple} class="uk-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="uk-label-danger"></span></div>{helpText}</div>',
            passwordConfirm: '<div class="uk-margin"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><div class="uk-flex"><div class="{prefix}-field-wrap"><input class="uk-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="uk-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="uk-label-danger"></span></div>{helpText}</div>',
            captcha: '<div class="uk-margin"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><div class="uk-grid uk-grid-small"><div><input class="uk-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="uk-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="uk-label-danger"></span></div>{helpText}',
            buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
            button: '<button class="uk-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
            launcher: '<div class="uk-margin"><label class="uk-form-label" for="{prefix}_{name}_btn">{label}:{bullet}</label><div class="uk-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="uk-button uk-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}{html}</div>',
            textarea: '<div class="uk-margin-bottom"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><br><div class="uk-form-controls"><textarea class="uk-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="uk-label-danger"></span></div>{helpText}</div></div>',
            checkboxlistItem: '<li><label><input class="uk-checkbox {prefix}-{name}-cbx" type="checkbox" data="{title}">&nbsp;&nbsp;{title}</label></li>',
            checkboxlist: '<div class="uk-margin-bottom"><label class="uk-form-label" for="{prefix}_{name}">{label}:{bullet}</label><div class="uk-panel uk-panel-scrollable{css}" id="{prefix}_{name}_wrap"><ul class="uk-list">{items}</ul></div>{helpText}</div>',
            valueslistItem: '<div class="uk-flex uk-margin-top {prefix}-{name}-item"><div class="uk-margin-right"><input placeholder="{langParameter}" type="text" class="uk-input formBuilder-valueslist-par" value="{key}"></div><div class="uk-margin-right"><input placeholder="{langValue}" type="text" class="uk-input formBuilder-valueslist-val" value="{value}"></div><div style="padding-top:3px"><button class="uk-icon-button uk-button-danger formBuilder-valueslist-btnDel" uk-icon="icon:minus"></button></div></div>',
            valueslistItemFixed: '<div class="uk-flex uk-margin-top {prefix}-{name}-item"><div class="uk-margin-right">{key}</div><div class="uk-margin-right"><input placeholder="{langValue}" type="text" class="uk-input formBuilder-valueslist-val" value="{value}"></div></div>',
            valueslist: '<div class="uk-flex uk-flex-column"><div class="uk-margin-bottom"><label class="uk-form-label">{label}:{bullet}</label></div><div><button type="button" class="uk-icon-button uk-button-primary formBuilder-valueslist-btnAdd" id="{prefix}_{name}_btnAdd" uk-icon="icon:plus" data-prefix="{prefix}" data-name="{name}"></button></div><div id="{prefix}_{name}_wrap" class="uk-margin-bottom {prefix}-formBuilder-valueslist-wrap">{items}</div></div>',
            bullet: '&nbsp;<span style="color:red;font-size:120%">&#8226;</span>'
        },
        template: {
            fields: '{fields}',
            buttons: '{buttons}'
        },
        lang: {
            mandatoryMissing: 'Should not be empty',
            tooShort: 'Too short',
            tooLong: 'Too long',
            invalidFormat: 'Doesn\'t match required format',
            passwordsNotMatch: 'Passwords do not match',
            parameter: 'Parameter',
            value: 'Value'
        },
        events: {
            onInit: () => {},
            onSaveSubmit: () => {},
            onSaveValidate: () => {},
            onSaveSuccess: () => {},
            onSaveError: () => {},
            onLoadStart: () => {},
            onLoadSuccess: () => {},
            onLoadError: () => {}
        },
        formDangerClass: 'uk-form-danger'
    };

    const Plugin = function(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._prefix = this.element.id;
        this._formTypes = ['text', 'email', 'password', 'tags', 'select', 'passwordConfirm', 'captcha', 'launcher', 'textarea', 'checkboxlist', 'valueslist', 'valueslistfixed', 'valueslisteditable'];
        this._saving = false;
        this.init();
    };

    $.extend(Plugin.prototype, {
        init: function() {
            let fieldsHTML = '';
            let buttonsHTML = '';
            for (let n in this.settings.items) {
                let item = this.settings.items[n];
                let bullet = '';
                if ((item.validation && !this.settings.edit && item.validation.mandatoryCreate) ||
                    (item.validation && this.settings.edit && item.validation.mandatoryEdit)) {
                    bullet = this.settings.html.bullet;
                }
                switch (item.type) {
                    case 'text':
                    case 'email':
                    case 'password':
                    case 'tags':
                        fieldsHTML += this._template(this.settings.html.text, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            css: (item.css ? ' ' + item.css : ''),
                            autofocus: (item.autofocus ? 'autofocus' : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            type: item.type
                        });
                        break;
                    case 'launcher':
                        fieldsHTML += this._template(this.settings.html.launcher, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            labelBtn: item.labelBtn,
                            data: item.data,
                            value: item.value,
                            css: (item.css ? ' ' + item.css : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            html: (item.html ? ' ' + item.html : '')
                        });
                        break;
                    case 'valueslist':
                        let valuesListItems = '';
                        for (let v in item.values) {
                            valuesListItems += this._template(this.settings.html.valueslistItem, {
                                prefix: this._prefix,
                                name: n,
                                key: item.values[v].p,
                                value: item.values[v].v,
                                langParameter: this.settings.lang.parameter,
                                langValue: this.settings.lang.value
                            });
                        }
                        fieldsHTML += this._template(this.settings.html.valueslist, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            items: valuesListItems
                        });
                        break;
                    case 'valueslisteditable':
                        let valuesListItemsEditable = '';
                        for (let v in item.values) {
                            valuesListItemsEditable += this._template(item.values[v].t ? this.settings.html.valueslistItemEditablePostfix : this.settings.html.valueslistItemEditable, {
                                prefix: this._prefix,
                                name: n,
                                key: item.values[v].p,
                                value: item.values[v].v,
                                postfix: item.values[v].t,
                                langParameter: this.settings.lang.parameter,
                                langValue: this.settings.lang.value
                            });
                        }
                        fieldsHTML += this._template(this.settings.html.valueslistEditable, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            items: valuesListItemsEditable,
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            buttons: item.buttons || ''
                        });
                        break;
                    case 'valueslistfixed':
                        let valuesListItemsFixed = '';
                        for (let v in item.values) {
                            valuesListItemsFixed += this._template(this.settings.html.valueslistItemFixed, {
                                prefix: this._prefix,
                                name: n,
                                key: item.values[v].p,
                                value: item.values[v].t,
                                data: item.values[v].v,
                                langParameter: this.settings.lang.parameter,
                                langValue: this.settings.lang.value
                            });
                        }
                        fieldsHTML += this._template(this.settings.html.valueslistFixed, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            items: valuesListItemsFixed
                        });
                        break;
                    case 'select':
                        let valuesHTML = '';
                        for (let v in item.values) {
                            valuesHTML += '<option value="' + v + '">' + item.values[v] + '</option>';
                        }
                        fieldsHTML += this._template(this.settings.html.select, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            css: (item.css ? ' ' + item.css : ''),
                            multiple: (item.multiple ? ' multiple' : ''),
                            autofocus: (item.autofocus ? 'autofocus' : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            type: item.type,
                            values: valuesHTML
                        });
                        break;
                    case 'checkboxlist':
                        let itemsHTML = '';
                        for (let v in item.values) {
                            itemsHTML += this._template(this.settings.html.checkboxlistItem, {
                                prefix: this._prefix,
                                name: n,
                                title: item.values[v]
                            });
                        }
                        fieldsHTML += this._template(this.settings.html.checkboxlist, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            css: (item.css ? ' ' + item.css : ''),
                            multiple: (item.multiple ? ' multiple' : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            items: itemsHTML
                        });
                        break;
                    case 'passwordConfirm':
                        fieldsHTML += this._template(this.settings.html.passwordConfirm, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            css: (item.css ? ' ' + item.css : ''),
                            autofocus: (item.autofocus ? 'autofocus' : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            type: 'password'
                        });
                        break;
                    case 'captcha':
                        fieldsHTML += this._template(this.settings.html.captcha, {
                            prefix: this._prefix,
                            name: n,
                            css: (item.css ? ' ' + item.css : ''),
                            label: item.label,
                            bullet: bullet,
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : ''),
                            autofocus: (item.autofocus ? 'autofocus' : '')
                        });
                        break;
                    case 'textarea':
                        fieldsHTML += this._template(this.settings.html.textarea, {
                            prefix: this._prefix,
                            name: n,
                            label: item.label,
                            bullet: bullet,
                            rows: (item.rows ? item.rows : '2'),
                            css: (item.css ? ' ' + item.css : ''),
                            autofocus: (item.autofocus ? 'autofocus' : ''),
                            helpText: (item.helpText ? this._template(this.settings.html.helpText, {
                                text: item.helpText,
                                prefix: this._prefix
                            }) : '')
                        });
                        break;
                    case 'buttons':
                        let buttons = '';
                        for (let i = 0; i < item.buttons.length; i++) {
                            let button = item.buttons[i];
                            buttons += this._template(this.settings.html.button, {
                                css: (button.css ? ' ' + button.css : ''),
                                prefix: this._prefix,
                                name: button.name || ('button' + i),
                                type: button.type || 'button',
                                label: button.label || ''
                            }) + '&nbsp;';
                        }
                        buttonsHTML += this._template(this.settings.html.buttonsWrap, {
                            prefix: this._prefix,
                            css: (item.css ? ' ' + item.css : ''),
                            buttons: buttons,
                            html: (item.html ? ' ' + item.html : '')
                        });
                        break;
                }
            }
            $(this.element).html(this._template(this.settings.template.fields, { fields: fieldsHTML }) + this._template(this.settings.template.buttons, { buttons: buttonsHTML }));
            $('.formBuilder-valueslist-btnAdd').unbind();
            $('.formBuilder-valueslist-btnAdd').click(function(e) {
                that._valueslistAddFunc($(this).attr('data-prefix'), $(this).attr('data-name'), '', '');
            });
            $('.formBuilder-valueslist-btnDel').unbind();
            $('.formBuilder-valueslist-btnDel').click(function(e) {
                $(this).parent().parent().remove();
            });
            $('.formBuilder-valueslistfixed-btnAdd').unbind();
            $('.formBuilder-valueslistfixed-btnAdd').click(function(e) {
                that._valueslistfixedAddFunc($(this).attr('data-prefix'), $(this).attr('data-name'), '', '');
            });
            $('.formBuilder-valueslistfixed-btnDel').unbind();
            $('.formBuilder-valueslistfixed-btnDel').click(function(e) {
                $(this).parent().parent().remove();
            });
            $('.formBuilder-valueslisteditable-btnAdd').unbind();
            $('.formBuilder-valueslisteditable-btnAdd').click(function(e) {
                that._valueslistAddFunc($(this).attr('data-prefix'), $(this).attr('data-name'), '', '');
            });
            $('.formBuilder-valueslisteditable-btnDel').unbind();
            $('.formBuilder-valueslisteditable-btnDel').click(function(e) {
                $(this).parent().parent().remove();
            });
            if (this.settings.events.onInit) {
                this.settings.events.onInit();
            }
            const that = this;
            $(this.element).submit((e) => {
                e.preventDefault();
                that._submit();
            });
            this._captchaInit();
            // Autofocus
            for (let n in this.settings.items) {
                let item = this.settings.items[n];
                if (item.autofocus) {
                    $('#' + this._prefix + '_' + n).focus();
                }
            }
        },
        _valueslistAddFunc(prefix, name, key, value, nofocus) {
            const valuesListItem = this._template(this.settings.html.valueslistItem, {
                prefix: prefix,
                name: name,
                key: key.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"),
                value: value,
                langParameter: this.settings.lang.parameter,
                langValue: this.settings.lang.value
            });
            $('#' + prefix + '_' + name + '_wrap').append(valuesListItem);
            if (!nofocus) {
                $('.' + prefix + '-' + name + '-item').last().find('div>input:first').focus();
            }
            $('.formBuilder-valueslist-btnDel').unbind();
            $('.formBuilder-valueslist-btnDel').click(function(e) {
                e.stopPropagation();
                $(this).parent().parent().remove();
            });
        },
        _valueslisteditableAddFunc(prefix, name, key, value, data, type, nofocus) {
            type = type === "undefined" ? null : type;
            if (key) {
                key = String(key);
                const valuesListItem = this._template(type ? this.settings.html.valueslistItemEditablePostfix : this.settings.html.valueslistItemEditable, {
                    prefix: prefix,
                    name: name,
                    key: key.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"),
                    value: value,
                    data: data,
                    postfix: type,
                    langParameter: this.settings.lang.parameter,
                    langValue: this.settings.lang.value
                });
                $('#' + prefix + '_' + name + '_wrap').append(valuesListItem);
                if (!nofocus) {
                    $('.' + prefix + '-' + name + '-item').last().find('div>input:first').focus();
                }
                $('.formBuilder-valueslisteditable-btnDel').unbind();
                $('.formBuilder-valueslisteditable-btnDel').click(function(e) {
                    e.stopPropagation();
                    $(this).parent().parent().remove();
                });
            }
        },
        _valueslistfixedAddFunc(prefix, name, key, value, nofocus) {
            const valuesListItem = this._template(this.settings.html.valueslistfixedItem, {
                prefix: prefix,
                name: name,
                key: key.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"),
                value: value,
                langParameter: this.settings.lang.parameter,
                langValue: this.settings.lang.value
            });
            $('#' + prefix + '_' + name + '_wrap').append(valuesListItem);
            if (!nofocus) {
                $('.' + prefix + '-' + name + '-item').last().find('div>input:first').focus();
            }
            $('.formBuilder-valueslistfixed-btnDel').unbind();
            $('.formBuilder-valueslistfixed-btnDel').click(function(e) {
                e.stopPropagation();
                $(this).parent().parent().remove();
            });
        },
        setValidation(flag) {
            this.validation = flag;
        },
        setEditMode(m) {
            this.settings.edit = m;
        },
        clearErrors() {
            $('.' + this._prefix + '-form-field').removeClass(this.settings.formDangerClass);
            $('.' + this._prefix + '-error-text').hide();
        },
        resetForm() {
            this.clearErrors();
            let that = this;            
            $('.' + this._prefix + '-form-field').not('.zoiaFormBuilder-no-reset').val('');
            $('select.' + this._prefix + '-form-field').prop('selectedIndex', 0);
            $('.formBuilder-valueslist-val').val('');
            $('.' + this._prefix + '-formBuilder-valueslist-wrap').html('');
            for (let n in this.settings.items) {
                let item = this.settings.items[n];
                if (item.default) {
                    $('#' + this._prefix + '_' + n).val(item.default);
                }
                if (item.type === 'launcher') {
                    $('#' + this._prefix + '_' + n + '_val').html(item.value);
                    $('#' + this._prefix + '_' + n + '_val').attr('data', item.data);
                }
                if (item.type === 'checkboxlist') {
                    $('.' + this._prefix + '-' + n + '-cbx').prop('checked', false);
                }
            }
        },
        serialize() {
            let json = {};
            for (let n in this.settings.items) {
                let field = this.settings.items[n];
                if (this._formTypes.indexOf(field.type) === -1) {
                    continue;
                }
                switch (field.type) {
                    case 'launcher':
                        json[n] = {
                            type: field.type,
                            value: $('#' + this._prefix + '_' + n + '_val').html(),
                            id: $('#' + this._prefix + '_' + n + '_val').attr('data')
                        };
                        break;
                    case 'checkboxlist':
                        const arrCbx = $('.' + this._prefix + '-' + n + '-cbx:checked').map(function() {
                            return $(this).attr('data');
                        }).get();
                        json[n] = {
                            type: field.type,
                            value: arrCbx.join(',')
                        }
                        break;
                    case 'valueslist':
                        let values = [];
                        $('.' + this._prefix + '-' + n + '-item').each(function() {
                            values.push({
                                p: String($(this).find('*>.formBuilder-valueslist-par').val()),
                                v: String($(this).find('*>.formBuilder-valueslist-val').val())
                            });
                        });
                        json[n] = {
                            type: field.type,
                            value: values
                        };
                        break;
                    case 'valueslisteditable':
                        let evalues = [];
                        $('.' + this._prefix + '-' + n + '-item').each(function() {
                            evalues.push({
                                p: String($(this).find('*>.formBuilder-valueslist-par').html()),
                                v: String($(this).find('*>.formBuilder-valueslist-val').val()),
                                d: String($(this).find('*>.formBuilder-valueslist-val').attr('data')),
                                t: String($(this).find('*>.formBuilder-valueslist-val').attr('data-postfix')),
                            });
                        });
                        json[n] = {
                            type: field.type,
                            value: evalues
                        };
                        break;
                    case 'valueslistfixed':
                        let fvalues = [];
                        $('.' + this._prefix + '-' + n + '-item').each(function() {
                            fvalues.push({
                                p: String($(this).find('*>.formBuilder-valueslist-val').attr('data')),
                                v: String($(this).find('*>.formBuilder-valueslist-val').val())
                            });
                        });
                        json[n] = {
                            type: field.type,
                            value: fvalues
                        };
                        break;
                    default:
                        json[n] = {
                            type: field.type,
                            value: $('#' + this._prefix + '_' + n).val()
                        };
                }
            }
            return json;
        },
        deserialize(json) {
            if (!json || typeof json !== 'object') {
                return;
            }
            for (let n in this.settings.items) {
                if (!json[n]) {
                    json[n] = {
                        id: '',
                        value: ''
                    };
                }
                switch (json[n].type) {
                    case 'launcher':
                        $('#' + this._prefix + '_' + n + '_val').html(json[n].value);
                        $('#' + this._prefix + '_' + n + '_val').attr('data', json[n].id);
                        break;
                    case 'checkboxlist':
                        const data = json[n].value.split(',');
                        for (let i in data) {
                            $('.editForm-groups-cbx[data="' + data[i] + '"]').prop('checked', true);
                        }
                        break;
                    case 'valueslist':
                        let values = [];
                        for (let v in json[n].value) {
                            values.push(json[n].value[v].p);
                            values.push(json[n].value[v].v);
                        }
                        $('#' + this._prefix + '_' + n + '_wrap').html('');
                        while (values.length > 0) {
                            const par = values.shift();
                            const val = values.shift();
                            this._valueslistAddFunc(this._prefix, n, par, val, true);
                        }
                        break;
                    case 'valueslisteditable':
                        let evalues = [];
                        for (let v in json[n].value) {
                            evalues.push(json[n].value[v].p);
                            evalues.push(json[n].value[v].v);
                            evalues.push(json[n].value[v].d);
                            evalues.push(json[n].value[v].t);
                        }
                        $('#' + this._prefix + '_' + n + '_wrap').html('');
                        while (evalues.length > 0) {
                            const par = evalues.shift();
                            const val = evalues.shift();
                            const dat = evalues.shift();
                            const typ = evalues.shift();
                            this._valueslisteditableAddFunc(this._prefix, n, par, val, dat, typ, true);
                        }
                        break;
                    case 'valueslistfixed':
                        $('.' + this._prefix + '-' + n + '-item-val').val('');
                        for (let v in json[n].value) {
                            $('.' + this._prefix + '-' + n + '-item-val[data="' + json[n].value[v].p + '"]').val(json[n].value[v].v);
                        }
                        break;
                    default:
                        $('#' + this._prefix + '_' + n).val(json[n].value || '');
                }
            }
        },
        deserializePart(n, item) {
            if (!item || typeof item !== 'object') {
                return;
            }
            if (!item) {
                item = {
                    id: '',
                    value: ''
                };
            }
            switch (item.type) {
                case 'launcher':
                    $('#' + this._prefix + '_' + n + '_val').html(item.value);
                    $('#' + this._prefix + '_' + n + '_val').attr('data', item.id);
                    break;
                case 'checkboxlist':
                    const data = item.value.split(',');
                    for (let i in data) {
                        $('.editForm-groups-cbx[data="' + data[i] + '"]').prop('checked', true);
                    }
                    break;
                case 'valueslist':
                    let values = [];
                    for (let v in item.value) {
                        values.push(item.value[v].p);
                        values.push(item.value[v].v);
                    }
                    $('#' + this._prefix + '_' + n + '_wrap').html('');
                    while (values.length > 0) {
                        const par = values.shift();
                        const val = values.shift();
                        this._valueslistAddFunc(this._prefix, n, par, val, true);
                    }
                    break;
                case 'valueslisteditable':
                    let evalues = [];
                    for (let v in item.value) {
                        evalues.push(item.value[v].p);
                        evalues.push(item.value[v].v);
                        evalues.push(item.value[v].d);
                        evalues.push(item.value[v].t);
                    }
                    $('#' + this._prefix + '_' + n + '_wrap').html('');
                    while (evalues.length > 0) {
                        const par = evalues.shift();
                        const val = evalues.shift();
                        const dat = evalues.shift();
                        const typ = evalues.shift();
                        this._valueslisteditableAddFunc(this._prefix, n, par, val, dat, typ, true);
                    }
                    break;
                case 'valueslistfixed':
                    $('.' + this._prefix + '-' + n + '-item-val').val('');
                    for (let v in item.value) {
                        $('.' + this._prefix + '-' + n + '-item-val[data="' + item.value[v].p + '"]').val(item.value[v].v);
                    }
                    break;
                default:
                    $('#' + this._prefix + '_' + n).val(item.value || '');
            }
        },
        loadJSON(data) {
            const that = this;
            jQuery.each(data, (key, value) => {
                $('#' + that._prefix + '_' + key).val(value);
                if (that.settings.items[key] && that.settings.items[key].type === 'checkboxlist' && value) {
                    const data = value.split(',');
                    for (let i in data) {
                        $('.editForm-groups-cbx[data="' + data[i] + '"]').prop('checked', true);
                    }
                }
                if (that.settings.items[key] && that.settings.items[key].type === 'valueslist' && value) {
                    let values = [];
                    for (let v in value) {
                        values.push(v);
                        values.push(value[v]);
                    }
                    $('#' + that._prefix + '_' + key + '_wrap').html('');
                    for (let i in value) {
                        that._valueslistAddFunc(that._prefix, key, values.shift(), values.shift());
                    }
                }
                if (that.settings.items[key] && that.settings.items[key].type === 'valueslisteditable' && value) {
                    let values = [];
                    for (let v in value) {
                        values.push(v);
                        values.push(value[v]);
                    }
                    $('#' + that._prefix + '_' + key + '_wrap').html('');
                    for (let i in value) {
                        that._valueslisteditableAddFunc(that._prefix, key, values.shift(), values.shift(), values.shift(), values.shift());
                    }
                }
                if (that.settings.items[key] && that.settings.items[key].type === 'valueslistfixed' && value) {
                    $('.' + this._prefix + '-' + key + '-item-val').val('');
                    for (let v in value) {
                        $('.' + this._prefix + '-' + key + '-item-val[data="' + value[v].p + '"]').val(value[v].v);
                    }
                }
            });
        },
        loadData(data) {
            if (this.settings.events.onLoadStart) {
                this.settings.events.onLoadStart();
            }
            this.resetForm();
            const that = this;
            $.ajax({
                type: this.settings.load.method,
                url: this.settings.load.url,
                data: data,
                cache: false
            }).done((res) => {
                if (res && res.status === 1) {
                    jQuery.each(res.item, (key, value) => {
                        $('#' + that._prefix + '_' + key).val(value);
                        if (that.settings.items[key] && that.settings.items[key].type === 'checkboxlist' && value) {
                            const data = value.split(',');
                            for (let i in data) {
                                $('.editForm-groups-cbx[data="' + data[i] + '"]').prop('checked', true);
                            }
                        }
                        if (that.settings.items[key] && that.settings.items[key].type === 'valueslist' && value) {
                            let values = [];
                            for (let v in value) {
                                values.push(v);
                                values.push(value[v]);
                            }
                            $('#' + that._prefix + '_' + key + '_wrap').html('');
                            for (let i in value) {
                                that._valueslistAddFunc(that._prefix, key, values.shift(), values.shift());
                            }
                        }
                        if (that.settings.items[key] && that.settings.items[key].type === 'valueslisteditable' && value) {
                            let values = [];
                            for (let v in value) {
                                values.push(v);
                                values.push(value[v]);
                            }
                            $('#' + that._prefix + '_' + key + '_wrap').html('');
                            for (let i in value) {
                                that._valueslisteditableAddFunc(that._prefix, key, values.shift(), values.shift(), values.shift());
                            }
                        }
                        if (that.settings.items[key] && that.settings.items[key].type === 'valueslistfixed' && value) {
                            $('.' + this._prefix + '-' + key + '-item-val').val('');
                            for (let v in value) {
                                $('.' + this._prefix + '-' + key + '-item-val[data="' + value[v].p + '"]').val(value[v].v);
                            }
                        }
                    });
                    if (that.settings.events.onLoadSuccess) {
                        that.settings.events.onLoadSuccess(res);
                    }
                } else if (that.settings.events.onLoadError) {
                    that.settings.events.onLoadError(res);
                }
            }).fail((jqXHR, exception) => {
                if (that.settings.events.onLoadError) {
                    that.settings.events.onLoadError(jqXHR, exception);
                }
            });
        },
        captchaRefresh() {
            $('.' + this._prefix + '-captcha-img').show();
            $('.' + this._prefix + '-captcha-img').attr('src', this.settings.captcha + '?' + new Date().getTime());
            $('.' + this._prefix + '-captcha-field').val('');
        },
        _captchaInit() {
            this.captchaRefresh();
            const that = this;
            $('img.' + this._prefix + '-captcha-img').click(() => {
                that.captchaRefresh();
            });
        },
        _template(s, d) {
            for (let p in d) {
                s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
            }
            return s;
        },
        validate(items) {
            let errors = {};
            let data = {};
            for (let n in this.settings.items) {
                let field = this.settings.items[n];
                if (this._formTypes.indexOf(field.type) === -1) {
                    continue;
                }
                if (field.type === 'launcher') {
                    data[n] = items ? (items[n] ? items[n].id : undefined) : $('#' + this._prefix + '_' + n + '_val').attr('data');;
                    continue;
                }
                if (field.type === 'valueslist') {
                    if (items && items[n]) {
                        data[n] = items[n].value;
                        continue;
                    }
                    let values = [];
                    let that = this;
                    $('.' + this._prefix + '-' + n + '-item').each(function() {
                        values.push({
                            p: String($(this).find('*>.formBuilder-valueslist-par').val()),
                            v: String($(this).find('*>.formBuilder-valueslist-val').val())
                        });
                    });
                    data[n] = values;
                    continue;
                }
                if (field.type === 'valueslisteditable') {
                    if (items && items[n]) {
                        data[n] = items[n].value;
                        continue;
                    }
                    let values = [];
                    let that = this;
                    $('.' + this._prefix + '-' + n + '-item').each(function() {
                        values.push({
                            p: String($(this).find('*>.formBuilder-valueslist-par').val()),
                            v: String($(this).find('*>.formBuilder-valueslist-val').val())
                        });
                    });
                    data[n] = values;
                    continue;
                }
                if (field.type === 'valueslistfixed') {
                    if (items && items[n]) {
                        data[n] = items[n].value;
                        continue;
                    }
                    let values = [];
                    let that = this;
                    $('.' + this._prefix + '-' + n + '-item').each(function() {
                        values.push({
                            p: String($(this).find('*>.formBuilder-valueslist-val').attr('data')),
                            v: String($(this).find('*>.formBuilder-valueslist-val').val())
                        });
                    });
                    data[n] = values;
                    continue;
                }
                if (field.type === 'checkboxlist') {
                    const arrCbx = $('.' + this._prefix + '-' + n + '-cbx:checked').map(function() {
                        return $(this).attr('data');
                    }).get();
                    data[n] = items ? (items[n] ? items[n].value : undefined) : arrCbx.join(',');
                    continue;
                }
                let fieldValue = items ? (items[n] ? items[n].value : undefined) : $('#' + this._prefix + '_' + n).val();
                if (field.validation) {
                    if ((!field.validation.mandatoryEdit && !fieldValue && this.settings.edit) || (!field.validation.mandatoryCreate && !fieldValue && !this.settings.edit)) {
                        continue;
                    }
                    if (field.validation.mandatoryCreate && !fieldValue && !this.settings.edit) {
                        errors[n] = this.settings.lang.mandatoryMissing;
                        continue;
                    }
                    if (field.validation.mandatoryEdit && !fieldValue && this.settings.edit) {
                        errors[n] = this.settings.lang.mandatoryMissing;
                        continue;
                    }
                    if (field.validation.process && typeof field.validation.process === 'function') {
                        fieldValue = field.validation.process(fieldValue);
                    }
                    if (field.type === 'passwordConfirm') {
                        let fieldConfirmValue = $('#' + this._prefix + '_' + n + 'Confirm').val();
                        if (fieldConfirmValue !== fieldValue) {
                            errors[n] = this.settings.lang.passwordsNotMatch;
                            continue;
                        }
                    }
                    if (field.validation.length) {
                        if (field.validation.length.min && fieldValue.length < field.validation.length.min) {
                            errors[n] = this.settings.lang.tooShort;
                            continue;
                        }
                        if (field.validation.length.max && fieldValue.length > field.validation.length.max) {
                            errors[n] = this.settings.lang.tooLong;
                            continue;
                        }
                    }
                    if (field.validation.regexp) {
                        if (!fieldValue.match(field.validation.regexp)) {
                            errors[n] = this.settings.lang.invalidFormat;
                            continue;
                        }
                    }
                    data[n] = fieldValue;
                }
            }
            return { data: data, errors: errors };
        },
        errors(errors) {
            if (Object.keys(errors).length > 0) {
                let focusSet = false;
                for (let k in errors) {
                    $('#' + this._prefix + '_' + k).addClass(this.settings.formDangerClass);
                    $('#' + this._prefix + '_' + k + '_error_text > span').html(errors[k]);
                    $('#' + this._prefix + '_' + k + '_error_text').show();
                    if (!focusSet) {
                        $('#' + this._prefix + '_' + k).focus();
                        focusSet = true;
                    }
                    if (this.settings.items[k].type === 'passwordConfirm') {
                        $('#' + this._prefix + '_' + k + 'Confirm').addClass(this.settings.formDangerClass);
                    }
                }
                return true;
            }
            return false;
        },
        _submit() {
            if (this._saving) {
                return;
            }
            if (this.settings.events.onSaveSubmit) {
                this.settings.events.onSaveSubmit();
            }
            this.clearErrors();
            const that = this;
            let data = {};
            let errors = {};
            if (this.settings.validation) {
                let _de = this.validate();
                data = _de.data || {};
                errors = _de.errors || {};
                if (this.errors(errors)) {
                    return;
                }
                if (this.settings.events.onSaveValidate) {
                    data = this.settings.events.onSaveValidate(data, errors) || data;
                    if (data === '__stop') {
                        return;
                    }
                }
            } else {
                if (this.settings.events.onSaveValidate) {
                    data = this.settings.events.onSaveValidate(data);
                    if (data === '__stop') {
                        return;
                    }
                }
            }
            that._saving = true;
            $.ajax({
                type: this.settings.save.method,
                url: this.settings.save.url,
                data: data,
                cache: false
            }).done((res) => {
                that._saving = false;
                if (res && res.status === 1) {
                    if (that.settings.events.onSaveSuccess) {
                        that.settings.events.onSaveSuccess(res);
                    }
                } else {
                    if (res.fields) {
                        for (let i in res.fields) {
                            let focusSet = false;
                            $('#' + that._prefix + '_' + res.fields[i]).addClass(that.settings.formDangerClass);
                            if (!focusSet) {
                                $('#' + that._prefix + '_' + res.fields[i]).focus();
                                focusSet = true;
                            }
                        }
                    }
                    that.captchaRefresh();
                    if (that.settings.events.onSaveError) {
                        that.settings.events.onSaveError(res);
                    }
                }
            }).fail((jqXHR, exception) => {
                that._saving = false;
                that.captchaRefresh();
                if (that.settings.events.onSaveError) {
                    that.settings.events.onSaveError(jqXHR, exception);
                }
            });
        }
    });

    $.fn[pluginName] = function(options) {
        let plugin;
        this.each(function() {
            plugin = $.data(this, 'plugin_' + pluginName);
            if (!plugin) {
                plugin = new Plugin(this, options);
                $.data(this, 'plugin_' + pluginName, plugin);
            }
        });
        return plugin;
    };
})(jQuery, window, document);