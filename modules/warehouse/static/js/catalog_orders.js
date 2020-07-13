/* eslint no-undef: 0 */
/* eslint max-len: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-nested-callbacks: 0 */

(() => {
    let locale;
    let settings;
    let deliveryData;
    let addressTemplate;
    let addressData;
    let prefix;
    let uprefix;
    let currencyPosition; 

    const getUrlParam = (sParam) => {
        let sPageURL = decodeURIComponent(window.location.search.substring(1));
        let sURLVariables = sPageURL.split('&');
        let sParameterName;
        let i;
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    const processTemplate = (s, d) => {
        for (let p in d) {
            s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
        }
        s = s.replace(new RegExp('({([^}]+)})', 'ig'), '');
        return s;
    };

    const processState = (eventState) => {
        const state = eventState || {
            action: getUrlParam('action'),
            id: getUrlParam('id')
        };
        switch (state.action) {
            case 'view':
                viewOrder(state.id);
                break;
            default:
                $('#zoiaSpinnerMain').hide();
                $('#wrapOrder').hide();
                $('#wrapOrders').show();
                break;
        }
    };

    const viewOrder = (id) => {
        $('#zoiaSpinnerMain').show();
        $('#orderID').html(id);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/orders/load',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            $('#zoiaSpinnerMain').hide();
            if (res.status === 1 && res.item) {
                const order = res.item;
                $('#za_order_date').html(new Date(parseInt(order.date, 10) * 1000).toLocaleString());
                $('#za_order_status').html(lang.orderStatuses[order.status]);
                $('#za_order_delivery').html(deliveryData[order.delivery]);
                if (order.tracking && order.tracking.length) {
                    $('.za-order-tracking-wrap').show();
                    $('#za_order_tracking').html(order.tracking);
                } else {
                    $('.za-order-tracking-wrap').hide();
                }
                let cartHTML = '<table class="za-table za-table-striped za-table-small za-table-middle za-table-responsive"><tbody>';
                for (let i in order.cart) {
                    const [iid, variant] = i.split('|');
                    let extraHTML = '';
                    for (let c in order.cart[i].checkboxes) {
                        if (res.propertiesData[order.cart[i].checkboxes[c]]) {
                            extraHTML += '<br>' + res.propertiesData[order.cart[i].checkboxes[c]];
                        }
                    }
                    for (let c in order.cart[i].integers) {
                        const [iid2, cnt] = order.cart[i].integers[c].split('|');
                        if (res.propertiesData[iid2]) {
                            extraHTML += '<br>' + res.propertiesData[iid2] + '&nbsp;(' + cnt + ')';
                        }
                    }
                    for (let c in order.cart[i].selects) {
                        const [sid, cnt] = order.cart[i].selects[c].split('|');
                        if (res.propertiesData[sid]) {
                            const [title, valuesStr] = res.propertiesData[sid].split('|');
                            const values = valuesStr.split(',');
                            extraHTML += '<br>' + title + ':&nbsp;' + values[cnt];
                        }
                    }
                    cartHTML += '<tr><td class="za-table-shrink">' + iid + '</td><td class="za-table-expand">' + res.cartData[iid] + (variant ? '&nbsp;(' + res.variants[variant] + ')' : '') + extraHTML + '</td><td class="za-table-shrink">' + order.cart[i].count + '</td><td class="za-table-shrink"></td></tr>';
                }
                cartHTML += '</tbody></table>';
                $('#za_order_cart').html(cartHTML);
                let costsHTML = '<table class="za-table za-table-striped za-table-small za-table-middle za-table-responsive" id="za_catalog_order_costs_table"><tbody>';
                costsHTML += '<tr><td class="za-table-expand">' + lang['Wares cost'] + '</td><td class="za-table-shrink">' + (currencyPosition === 'left' ? settings.currency : '') + (order.costs.totalWares !== 'NaN' ? order.costs.totalWares : 0) + (currencyPosition === 'right' ? '&nbsp;' + settings.currency : '') + '</td><td class="za-table-shrink"></td></tr>';
                costsHTML += '<tr><td class="za-table-expand">' + lang['Delivery'] + '</td><td class="za-table-shrink">' + (currencyPosition === 'left' ? settings.currency : '') + (order.costs.delivery !== 'NaN' ? order.costs.delivery : 0) + (currencyPosition === 'right' ? '&nbsp;' + settings.currency : '') + '</td><td class="za-table-shrink"></td></tr>';
                for (let i in order.costs.extra) {
                    costsHTML += '<tr><td class="za-table-expand">' + res.addressData[i] + '</td><td class="za-table-shrink">' + (currencyPosition === 'left' ? settings.currency : '') + (order.costs.extra[i] !== 'NaN' ? order.costs.extra[i] : 0) + (currencyPosition === 'right' ? '&nbsp;' + settings.currency : '') + '</td><td class="za-table-shrink"></td></tr>';
                }
                costsHTML += '<tr><td class="za-table-expand">' + lang['Total'] + '</td><td class="za-table-shrink">' + (currencyPosition === 'left' ? settings.currency : '') + (order.costs.total !== 'NaN' ? order.costs.total : 0) + (currencyPosition === 'right' ? '&nbsp;' + settings.currency : '') + '</td><td class="za-table-shrink"></td></tr>';
                costsHTML += '</tbody></table>';
                $('#za_order_costs').html(costsHTML);
                let addressHTML = '';
                if (res.delivery.delivery !== 'pickup') {
                    $('.za-catalog-metadata-wrap').addClass('za-grid-divider');
                    for (let i in order.address) {
                        if (addressData[i] && addressData[i][order.address[i]]) {
                            order.address[i] = addressData[i][order.address[i]];
                        }
                    }
                    addressHTML = processTemplate(addressTemplate.data, order.address);
                } else {
                    $('.za-catalog-metadata-wrap').removeClass('za-grid-divider');
                }
                $('#za_order_address').html(addressHTML);
                if (order.status > 0) {
                    $('#za_order_btn_pay_wrap').show();
                } else {
                    $('#za_order_btn_pay_wrap').hide();
                }
                if (order.paid) {
                    $('#za_order_status_badge_paid').show();
                    $('#za_order_status_badge_unpaid').hide();
                    $('#za_order_btn_pay').hide();
                } else {
                    $('#za_order_status_badge_paid').hide();
                    $('#za_order_status_badge_unpaid').show();
                    $('#za_order_btn_pay').attr('href', $('#za_order_btn_pay').attr('data') + '/payment?id=' + order._id);
                    $('#za_order_btn_pay').show();
                }
                $('#wrapOrders').hide();
                $('#wrapOrder').show();
            } else {
                window.history.go(-1);
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1000
                });
            }
        }).fail(() => {
            $('#zoiaSpinnerMain').hide();
            window.history.go(-1);
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1000
            });
        });
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        settings = JSON.parse($('#zp_settings').attr('data'));
        deliveryData = JSON.parse($('#zp_deliveryData').attr('data'));
        addressTemplate = JSON.parse($('#zp_addressTemplate').attr('data'));
        addressData = JSON.parse($('#zp_addressData').attr('data'));
        prefix = $('#zp_prefix').attr('data');
        uprefix = $('#zp_uprefix').attr('data');
        currencyPosition = $('#zp_currencyPosition').attr('data');
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            const ordersTableData = {
                url: '/api/warehouse/orders',
                limit: 20,
                sort: {
                    field: '_id',
                    direction: 'desc'
                },
                fields: {
                    _id: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    date: {
                        sortable: true,
                        process: (id, item, value) => {
                            return new Date(parseInt(value, 10) * 1000).toLocaleString();
                        }
                    },
                    costs: {
                        sortable: false,
                        process: (id, item, value) => {
                            return (currencyPosition === 'left' ? settings.currency : '') + (value.total !== 'NaN' ? value.total : 0) + (currencyPosition === 'right' ? '&nbsp;' + settings.currency : '');
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.orderStatuses[value];
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-order-view-btn" za-icon="icon:more" data="' + item._id +
                                '" style="margin-right:5px"></button>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-order-view-btn').unbind().click(function() {
                        window.history.pushState({ action: 'view', id: $(this).attr('data') }, document.title, uprefix + prefix + '/orders?action=view&id=' + $(this).attr('data'));
                        viewOrder($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            $('#orders').zoiaTable(ordersTableData);
            window.setTimeout(function() {
                $(window).bind('popstate',
                    (event) => {
                        processState(event.originalEvent.state);
                    });
                processState();
            }, 0);
        });
    });
})();