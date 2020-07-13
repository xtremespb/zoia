/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let currencyPosition;
    let settings;
    let locale;

    const _setSpinnerSize = () => {
        $('#za_catalog_cart_table_spinner').width($('#za_catalog_cart_table').width()).height($('#za_catalog_cart_table').height());
    };

    const _debounce = (fn, delay) => {
        let timer = null;
        return function() {
            const that = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(that, args);
            }, delay);
        };
    };

    $(document).ready(() => {
        currencyPosition = $('#zp_currencyPosition').attr('data');
        settings = JSON.parse($('#zp_settings').attr('data'));
        locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            _setSpinnerSize();
            $('.za-catalog-cart-count').keyup(_debounce(function() {
                let val = $(this).val().trim();
                $(this).removeClass('za-form-danger');
                if (!val.match(/^[0-9]+$/) || val.length > 5) {
                    return $(this).addClass('za-form-danger');
                }
                const that = this;
                if (val === $(that).attr('data-prev')) {
                    return;
                }
                $(that).attr('data-prev', val);
                _setSpinnerSize();
                $('#za_catalog_cart_table_spinner').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/warehouse/cart/count',
                    data: {
                        id: $(that).attr('data'),
                        variant: $(that).attr('data-variant'),
                        count: val
                    },
                    cache: false
                }).done((res) => {
                    setTimeout(() => {
                        $('#za_catalog_cart_table_spinner').hide();
                    }, 300);
                    if (res.status !== 1) {
                        $(that).addClass('za-form-danger');
                    } else {
                        if (res.count !== val) {
                            $(that).val(res.count);
                        }
                        if (!res.subtotal || res.subtotal === 'NaN') {
                            res.subtotal = 0;
                        }
                        $('.za-catalog-cart-subtotal[data="' + res.id + '"][data-variant="' + res.variant + '"]').html(currencyPosition === 'right' ? (res.subtotal + '&nbsp;' + settings.currency) : (settings.currency + res.subtotal)).attr('data-val', res.subtotal);
                        let total = 0;
                        $('.za-catalog-cart-subtotal').each(function() {
                            total += parseFloat($(this).attr('data-val'));
                        });
                        if (!total) {
                            total = 0;
                        }
                        $('.za-catalog-cart-total').html(currencyPosition === 'right' ? (parseFloat(total).toFixed(2) + '&nbsp;' + settings.currency) : (settings.currency + parseFloat(total).toFixed(2)));
                    }
                }).fail(() => {
                    setTimeout(() => {
                        $('#za_catalog_cart_table_spinner').hide();
                    }, 300);
                    $(that).addClass('za-form-danger');
                });
            }, 250));
            $('.za-catalog-cart-btn-del').click(function() {
                const that = this;
                $('#za_catalog_cart_table_spinner').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/warehouse/cart/delete',
                    data: {
                        id: $(that).attr('data'),
                        variant: $(that).attr('data-variant')
                    },
                    cache: false
                }).done((res) => {
                    setTimeout(() => {
                        $('#za_catalog_cart_table_spinner').hide();
                    }, 300);
                    if (res.status === 1) {
                        $(that).parent().parent().remove();
                        if ($('#za_catalog_cart_table>tbody').children().length === 0) {
                            $('#za_catalog_cart_wrap').hide();
                            $('#za_catalog_cart_empty').show();
                        }
                        let total = 0;
                        $('.za-catalog-cart-subtotal').each(function() {
                            total += parseFloat($(this).attr('data-val'));
                        });
                        $('.za-catalog-cart-total').html(currencyPosition === 'right' ? (parseFloat(total).toFixed(2) + '&nbsp;' + settings.currency) : (settings.currency + parseFloat(total).toFixed(2)));
                    } else {
                        $zUI.notification(lang['Could not delete item from your cart'], {
                            status: 'danger',
                            timeout: 1000
                        });
                    }
                }).fail(() => {
                    setTimeout(() => {
                        $('#za_catalog_cart_table_spinner').hide();
                    }, 300);
                    $zUI.notification(lang['Could not delete item from your cart'], {
                        status: 'danger',
                        timeout: 1000
                    });
                });
            });
        });
    });
})();