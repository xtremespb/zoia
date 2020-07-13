/* eslint no-undef: 0 */
/* eslint max-len: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-nested-callbacks: 0 */
/* eslint no-loop-func: 0 */
/* eslint no-nested-ternary: 0 */

(() => {
    let totalWares = 0;
    let loading = false;

    let locale;
    let settings;
    let addressJSON;
    let weight;
    let isAuth;
    let payBeforeOrderIsPlaced;
    let currencyPosition;

    const filterInput = function() {
        $(this).removeClass('za-form-danger');
        const _regex = $(this).attr('data-mask');
        const val = $(this).val().trim();
        if ($(this).attr('data-mandatory') && val === '') {
            $(this).addClass('za-form-danger');
            return;
        }
        if (_regex) {
            if (!$(this).attr('data-mandatory') && val === '') {
                return;
            }
            const regex = new RegExp(_regex);
            if (!regex.test(val)) {
                $(this).addClass('za-form-danger');
            }
        }
        return;
    };

    const submitOrder = function(event) {
        event.preventDefault();
        if (loading) {
            return;
        }
        $('#za_catalog_order_form_error').hide();
        $('#za_catalog_form_captcha_error_text').hide();
        $('.za-catalog-form-input').removeClass('za-form-danger');
        let errors;
        let focus;
        let fields = {
            delivery: $('#za_catalog_form_delivery').val()
        };
        $('.za-catalog-order-form-rx').each(function() {
            if ($('#za_catalog_form_delivery').find(':selected').attr('data-type') === 'delivery' ||
                $(this).attr('id').replace('za_catalog_form_', '') === 'email' ||
                $(this).attr('id').replace('za_catalog_form_', '') === 'phone') {
                const val = $(this).val().trim();
                const _regex = $(this).attr('data-mask');
                if ($(this).attr('data-mandatory') && val === '') {
                    $(this).addClass('za-form-danger');
                    errors = true;
                    if (!focus) {
                        focus = true;
                        $(this).focus();
                    }
                    return;
                }
                if (_regex) {
                    if (!$(this).attr('data-mandatory') && val === '') {
                        return;
                    }
                    const regex = new RegExp(_regex);
                    if (!regex.test(val)) {
                        $(this).addClass('za-form-danger');
                        errors = true;
                        if (!focus) {
                            focus = true;
                            $(this).focus();
                        }
                        return;
                    }
                }
                fields[$(this).attr('id').replace('za_catalog_form_', '')] = val;
            }
        });
        if (!isAuth) {
            fields.captcha = $('#za_catalog_form_captcha').val().trim();
            if (!fields.captcha || !fields.captcha.match(/^([0-9]+){4}$/)) {
                errors = true;
                $('#za_catalog_form_captcha_error_text').show();
            }
        }
        if (errors) {
            $('#za_catalog_order_form_error').show();
            return;
        }
        loading = true;
        $('.za_catalog_order_submit_spinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/order',
            data: fields,
            cache: false
        }).done((res) => {
            loading = false;
            if (res && parseInt(res.status, 10) === -101) {
                location.href = $('#za_order_btn_pay').attr('data');
                return;
            }
            $('.za_catalog_order_submit_spinner').hide();
            if (res.status !== 1 || !res.order) {                
                captchaRefresh();
                if (res.error) {
                    return $zUI.notification(res.error, {
                        status: 'danger',
                        timeout: 1500
                    });
                }
                if (res.fields) {
                    let focusS = false;
                    for (let i in res.fields) {
                        $('#za_catalog_form_' + res.fields[i]).addClass('za-form-danger');
                        if (res.fields[i] === 'captcha') {
                            $('#za_catalog_form_captcha_error_text').show();
                        }
                        if (!focusS) {
                            focusS = true;
                            $('#za_catalog_form_' + res.fields[i]).focus();
                        }
                    }
                    $zUI.notification(lang['Form contains errors'], {
                        status: 'danger',
                        timeout: 1500
                    });
                } else {
                    $zUI.notification(lang['Could not place your order. Please try again later or contact website support.'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            } else {
                if (payBeforeOrderIsPlaced) {
                    $('.za_catalog_order_submit_spinner').show();
                    location.href = $('#za_order_btn_pay').attr('data') + '/payment?id=' + res.order._id;
                } else {
                    $('#za_catalog_order_wrap').hide();
                    $('#za_catalog_order_success_id').html(res.order._id);
                    $('#za_catalog_order_success').show();
                    $('#za_order_btn_pay').attr('href', $('#za_order_btn_pay').attr('data') + '/payment?id=' + res.order._id);
                    $('#za_order_btn_goto').attr('href', $('#za_order_btn_pay').attr('data') + '/orders?action=view&id=' + res.order._id);
                }
            }
        }).fail(() => {
            loading = false;
            $('.za_catalog_order_submit_spinner').hide();
            captchaRefresh();
            $zUI.notification(lang['Could not place your order. Please try again later or contact website support.'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const getAddressLabel = (id) => {
        if (id === 'za_catalog_form_delivery') {
            return lang.Delivery;
        }
        for (let i in addressJSON) {
            let item = addressJSON[i];
            if (item.id === id) {
                return item.label[locale];
            }
        }
        return '';
    };

    const captchaRefresh = () => {
        $('.za-catalog-order-captcha-img').show();
        $('.za-catalog-order-captcha-img').attr('src', '/api/captcha?' + new Date().getTime());
        $('#za_catalog_form_captcha').val('');
    };

    const captchaInit = () => {
        captchaRefresh();
        $('.za-catalog-order-captcha-img').click(() => {
            captchaRefresh();
        });
    };

    const calculateFields = function() {
        let total = totalWares;
        let costs = {};
        if ($('#za_catalog_form_delivery').find(':selected').attr('data-type') === 'delivery') {
            $('.za-catalog-order-form-rx').each(function() {
                const id = $(this).attr('id').replace('za_catalog_form_', '');
                const cost = $(this).attr('data-cost') || parseFloat($(this).find(':selected').attr('data-cost')) || 0;
                const addPrc = $(this).attr('data-addprc') || parseFloat($(this).find(':selected').attr('data-addprc')) || 0;
                const costWeight = $(this).attr('data-weight') || parseFloat($(this).find(':selected').attr('data-weight')) || 0;
                if (cost || addPrc || costWeight) {
                    let subtotal = 0;
                    if (cost) {
                        subtotal += cost;
                    }
                    if (addPrc) {
                        subtotal += (totalWares / 100) * addPrc;
                    }
                    if (costWeight) {
                        subtotal += costWeight * weight;
                    }
                    if (!subtotal) {
                        subtotal = 0;
                    }
                    total += parseFloat(subtotal);
                    costs[id === 'delivery' ? lang['Delivery'] : getAddressLabel(id)] = currencyPosition === 'right' ? (parseFloat(subtotal).toFixed(2).replace(/\.00$/gm, '') + '&nbsp;' + settings.currency) : (settings.currency + parseFloat(subtotal).toFixed(2).replace(/\.00$/gm, ''));
                }
            });
        }
        if (!total) {
            total = 0;
        }
        total = parseFloat(total).toFixed(2).replace(/\.00$/gm, '');
        $('.za-catalog-cart-extra').remove();
        let extraHTML = '';
        for (let i in costs) {
            extraHTML += '<tr class="za-catalog-cart-extra"><td>' + i + '</td><td colspan="2"></td><td>' + costs[i] + '</td></tr>';
        }
        $('#za-catalog-cart-table').append(extraHTML);
        $('.za-catalog-cart-total').html(currencyPosition === 'right' ? (total + '&nbsp;' + settings.currency) : (settings.currency + total));
    };

    const onDeliveryChange = () => {
        if ($('#za_catalog_form_delivery').find(':selected').attr('data-type') === 'delivery') {
            $('#za_catalog_order_form').show();
        } else {
            $('#za_catalog_order_form').hide();
        }
        $('#za_catalog_order_form_error').hide();
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        settings = JSON.parse($('#zp_settings').attr('data'));
        addressJSON = JSON.parse($('#zp_addressJSON').attr('data'));
        weight = parseFloat($('#zp_weight').attr('data'));
        isAuth = $('#zp_isAuth').attr('data') === 'true' ? true : false;
        payBeforeOrderIsPlaced = $('#zp_payBeforeOrderIsPlaced').attr('data') === 'true' ? true : false;
        currencyPosition = $('#zp_currencyPosition').attr('data');
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            let formHTML = '';
            for (let i in addressJSON) {
                let item = addressJSON[i];
                switch (item.type) {
                    case 'text':
                        formHTML += '<div class="za-margin"><label class="za-form-label" for="za_catalog_form_' + item.id + '">' + item.label[locale] + ': ' + (item.mandatory ? '<span class="za-text-danger za-text-bold">&nbsp;*</span>' : '') + '</label><div class="za-form-controls"><input class="za-catalog-order-form-rx za-catalog-form-input za-input za-width-' + item.width + '" id="za_catalog_form_' + item.id + '" type="text" maxlength="' + item.maxlength + '" data-mask="' + (item.regex ? item.regex : '') + '" data-mandatory="' + (item.mandatory ? 'true' : '') + '"></div></div>';
                        break;
                    case 'select':
                        let opts = '';
                        item.values.sort(function(a, b) {
                            const x = a.lang[locale].toLowerCase();
                            const y = b.lang[locale].toLowerCase();
                            return x < y ? -1 : (x > y ? 1 : 0);
                        });
                        for (let v in item.values) {
                            const iv = item.values[v];
                            let selected = '';
                            if (item.default && item.default === iv.value) {
                                selected = ' selected';
                            }
                            opts += '<option value="' + iv.value + '" data-addprc="' + iv.addPrc + '" data-cost="' + iv.cost + '"' + selected + '>' + iv.lang[locale] + '</option>';
                        }
                        formHTML += '<div class="za-margin"><label class="za-form-label" for="za_catalog_form_' + item.id + '">' + item.label[locale] + ':&nbsp;</label><div class="za-form-controls"><select class="za-catalog-form-input za-catalog-order-form-rx za-select za-width-' + item.width + '" id="za_catalog_form_' + item.id + '">' + opts + '</select></div></div>';
                        break;
                    default:
                }
            }
            $('#za_catalog_order_form').html(formHTML);
            $('.za-catalog-order-form-rx').on('input', filterInput);
            $('#za_catalog_form_captcha').on('input', filterInput);
            $('.za-catalog-order-form-rx').on('input', calculateFields);
            $('#za_catalog_order_submit').click(submitOrder);
            $('#za_catalog_form_delivery').on('input', onDeliveryChange);
            totalWares = parseFloat($('.za-catalog-cart-total').attr('data-total'));
            calculateFields();
            onDeliveryChange();
            captchaInit();
        });
    });
})();