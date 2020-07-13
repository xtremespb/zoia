/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let price;
    let za_catalog_item_id;
    let za_catalog_cart_count;
    const calculatePrice = () => {
        let checkboxes = [];
        let integers = [];
        let selects = [];
        let priceCurrent = price;
        $('.za-catalog-item-checkbox').each(function() {
            if ($(this).is(':checked')) {
                checkboxes.push($(this).attr('data-id'));
                const itemPrice = parseFloat($(this).attr('data-price'));
                priceCurrent += itemPrice;
            }
        });
        $('.za-catalog-item-integer').each(function() {
            if ($(this).is(':checked')) {
                const id = $(this).attr('data-id');
                let val = id.match(/_float$/) ? parseFloat($('#za_catalog_item_integer_' + id).val()).toFixed(2) : parseInt($('#za_catalog_item_integer_' + id).val(), 10);
                if (!val) {
                    val = 1;
                }
                integers.push($(this).attr('data-id') + '|' + val);
                const itemPrice = parseFloat($(this).attr('data-price')) * val;
                $('#za_catalog_item_integer_val_' + id).html(parseFloat(itemPrice).toFixed(2));
                priceCurrent += itemPrice;
            }
        });
        $('.za-catalog-item-select').each(function() {
            selects.push($(this).find(':selected').data('id') + '|' + $(this).val());
            priceCurrent += parseFloat($(this).find(':selected').data('price'));
        });
        $('#za_catalog_item_price').html(parseFloat(priceCurrent).toFixed(2));
        return {
            checkboxes: checkboxes,
            integers: integers,
            selects: selects
        };
    };

    $(document).ready(() => {
        price = parseFloat($('#za_catalog_item_price').html());
        za_catalog_item_id = $('#zp_za_catalog_item_id').attr('data');
        za_catalog_cart_count = parseInt($('#zp_za_catalog_cart_count').attr('data'), 10);
        const locale = $('#zp_locale').attr('data');
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            if (za_catalog_cart_count) {
                $('.za-catalog-cart-count').html(za_catalog_cart_count).show();
            }
            $('.za-catalog-item-variant').click(function() {
                price = parseFloat($(this).attr('data-price'));
                calculatePrice();
            });
            $('.za-catalog-item-checkbox').click(calculatePrice);
            $('.za-catalog-item-integer').click(calculatePrice);
            $('.za-catalog-item-select').click(calculatePrice).change(calculatePrice);
            $('.za-catalog-item-integer-field').change(calculatePrice).click(calculatePrice).keypress(calculatePrice);
            $('.za-catalog-cart-add-btn').click(() => {
                const variantId = $('input[name="za_item_variants"]:checked').attr('data-id');
                const priceData = calculatePrice();
                $('.za-catalog-cart-add-spinner').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/warehouse/cart/add',
                    data: {
                        id: za_catalog_item_id,
                        variant: variantId,
                        checkboxes: priceData.checkboxes || [],
                        integers: priceData.integers || [],
                        selects: priceData.selects || []
                    },
                    cache: false
                }).done((res) => {
                    $('.za-catalog-cart-add-spinner').hide();
                    if (res.status === 1) {
                        $zUI.notification(lang['Added to your cart'], {
                            status: 'success',
                            timeout: 1000
                        });
                        if (res.count) {
                            $('.za-catalog-cart-count').html(res.count).show();
                        }
                    } else {
                        $zUI.notification(lang['Could not add item to the cart'], {
                            status: 'danger',
                            timeout: 1000
                        });
                    }
                }).fail(() => {
                    $('.za-catalog-cart-add-spinner').hide();
                });
            });
            $('.za-catalog-item-variant:first').click();
        });
    });
})();