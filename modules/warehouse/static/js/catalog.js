/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let za_catalog_cart_count;
    let locale;
    let querySort;
    let queryPage;
    let queryText;

    const filterQuery = (e) => {
        e.preventDefault();
        location.href = '?p=' + queryPage + '&s=' + querySort + '&t=' + $('#za_catalog_search_text').val().trim();
    };

    $(document).ready(() => {
        za_catalog_cart_count = parseInt($('#zp_za_catalog_cart_count').attr('data'), 10);
        locale = $('#zp_locale').attr('data');
        querySort = $('#zp_querySort').attr('data');
        queryPage = parseInt($('#zp_queryPage').attr('data'), 10);
        queryText = $('#zp_queryText').attr('data');
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            if (za_catalog_cart_count) {
                $('.za-catalog-cart-count').html(za_catalog_cart_count).show();
            }
            $('#za_catalog_sort_order').change(() => {
                location.href = '?p=' + queryPage + '&s=' + $('#za_catalog_sort_order').val() + '&t=' + queryText;
            });
            if (za_catalog_cart_count) {
                $('.za-catalog-cart-count').html(za_catalog_cart_count).show();
            }
            $('.za-catalog-item-button').click(function() {
                let that = this;
                $('.za-catalog-item-button-spinner[data="' + $(that).attr('data') + '"]').show();
                $.ajax({
                    type: 'POST',
                    url: '/api/warehouse/cart/add',
                    data: {
                        id: $(that).attr('data')
                    },
                    cache: false
                }).done((res) => {
                    $('.za-catalog-item-button-spinner[data="' + $(that).attr('data') + '"]').hide();
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
                    $('.za-catalog-item-button-spinner[data="' + $(that).attr('data') + '"]').hide();
                });
            });
            $('#za_catalog_search_btn').click(filterQuery);
            $('#za_catalog_search_form').submit(filterQuery);
        });
    });
})();