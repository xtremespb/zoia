/* eslint max-len: 0 */
/* eslint no-undef: 0 */

(() => {
    let locale;
    let uprefix;
    let tickers;
    let info;

    let currentTicker;
    let startChartItem;
    let chartData;
    let chartDataFull;
    let chart;
    let currentChartDataSet;

    let settingsDialog;

    const zoiaTickerLinkClickHandler = function(data) {
        currentTicker = data || currentTicker;
        $('.zoia-wrap-info').hide();
        $('.zoia-wrap-ticker').show();
        $('.zoia-ticker-name').html(currentTicker.ticker);
        $('.zoia-ticker-full-name').html(currentTicker.full_name);
        $('.zoia-ticker-price').html(`$${currentTicker.price}`);
        $('.zoia-ticker-position').html(`${currentTicker.position_value < 0 ? lang['Short'] : lang['Long']} ${currentTicker.position_value}`);
    };

    const processState = (eventState) => {
        eventState = eventState || {};
        switch (eventState.action) {
            case 'ticker':
                zoiaTickerLinkClickHandler(currentTicker);
                break;
            default:
                $('.zoia-wrap-ticker').hide();
                $('.zoia-wrap-info').show();
                break;
        }
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        uprefix = $('#zp_uprefix').attr('data');
        tickers = JSON.parse($('#zp_tickers').attr('data'));
        info = JSON.parse($('#zp_apiInfo').attr('data'));
        settingsDialog = $zUI.modal('#chartSettingsModal', {
            bgClose: true,
            escClose: true
        });
        $('#chartSettingsButton').click(() => {
            $('#chartSettingsSpinner').hide();
            $('.chart-settings-button').show();
            $('#chartColorLine').val(chart.graphs[1].lineColor);
            $('#chartColorPositive').val(chart.graphs[0].lineColor);
            $('#chartColorNegative').val(chart.graphs[0].negativeLineColor);
            $('.zoia-chart-checkbox-line').prop('checked', !chart.graphs[1].hidden);
            $('.zoia-chart-checkbox-candles').prop('checked', !chart.graphs[0].hidden);
            $('.zoia-chart-checkbox-line').data('prev-checked', $('.zoia-chart-checkbox-line').is(':checked'));
            $('.zoia-chart-checkbox-candles').data('prev-checked', $('.zoia-chart-checkbox-candles').is(':checked'));
            settingsDialog.show();
        });
        $('#chartSettingsSaveButton').click(() => {
            $('#chartSettingsSpinner').show();
            $('.chart-settings-button').hide();
            let flag;
            if (chart.graphs[0].fillColors !== $('#chartColorPositive').val()) {
                flag = true;
                chart.graphs[0].fillColors = $('#chartColorPositive').val();
                chart.graphs[0].lineColor = $('#chartColorPositive').val();
            }
            if (chart.graphs[0].negativeFillColors !== $('#chartColorNegative').val()) {
                flag = true;
                chart.graphs[0].negativeFillColors = $('#chartColorNegative').val();
                chart.graphs[0].negativeLineColor = $('#chartColorNegative').val();
            }
            if (chart.graphs[1].lineColor !== $('#chartColorLine').val()) {
                flag = true;
                chart.graphs[1].lineColor = $('#chartColorLine').val();
            }
            const flag2 = $('.zoia-chart-checkbox-line').is(':checked') !== $('.zoia-chart-checkbox-line').data('prev-checked') ||
                $('.zoia-chart-checkbox-candles').is(':checked') !== $('.zoia-chart-checkbox-candles').data('prev-checked');
            setTimeout(() => {
                $('#chartSettingsSpinner').hide();
                $('.chart-settings-button').show();
                settingsDialog.hide();
            }, flag2 ? 1000 : 0);
            setTimeout(() => {
                if (flag2) {
                    $('.zoia-chart-checkbox-line').is(':checked') ? !chart.graphs[1].hidden || chart.showGraph(chart.graphs[1]) : chart.graphs[1].hidden || chart.hideGraph(chart.graphs[1]);
                    $('.zoia-chart-checkbox-candles').is(':checked') ? !chart.graphs[0].hidden || chart.showGraph(chart.graphs[0]) : chart.graphs[0].hidden || chart.hideGraph(chart.graphs[0]);
                }
                if (flag) {
                    chart.validateNow();
                }
            }, flag2 ? 500 : 0);
        });
        $('.chart-button-period').click(function(e) {
            $('.chart-button-period').removeClass('za-button-secondary');
            $(this).addClass('za-button-secondary');            
            switch ($(this).attr('id')) {
                case 'chartEverythingButton':
                    if (currentChartDataSet === 'chartEverythingButton') {
                        return;
                    }                    
                    currentChartDataSet = 'chartEverythingButton';
                    chartData = [...chartDataFull];
                    chart.dataProvider = chartData;
                    $('.chart-button').hide();
            		$('#chartTickersSpinner').show();
            		setTimeout(() => {
            			chart.validateData();
            			$('.chart-button').show();
            			$('#chartTickersSpinner').hide();
            		}, 500);
                    break;
                case 'chartMonthButton':
                    if (currentChartDataSet === 'chartMonthButton') {
                        return;
                    }
                    currentChartDataSet = 'chartMonthButton';
                    //chart.zoomOut();
                    let buf = [...chartDataFull];
                    let data = [];
                    while (buf.length > 0) {
                        let n;
                        let min = 999999999999999999;
                        let max = 0;
                        for (let i = 0; i < buf.length; i++) {
                            if (moment(buf[0].date).format('MM') !== moment(buf[i].date).format('MM')) {
                                n = i;
                                break;
                            }
                            if (buf[i].high > max) {
                                max = buf[i].high;
                            }
                            if (buf[i].low < min) {
                                min = buf[i].low;
                            }
                        }
                        n = (n > 0 ? n - 1 : null) || buf.length - 1;
                        const open = buf[0].open;
                        const close = buf[n].close;
                        const date = buf[n].date || buf[0].date;
                        for (let i = 0; i < n + 1; i++) {
                            buf.shift();
                        }
                        data.push({
                            value: close,
                            open: open,
                            close: close,
                            high: max,
                            low: min,
                            date: date
                        });
                        //break;
                    }
                    chartData = data;
                    chart.dataProvider = chartData;
                    $('.chart-button').hide();
            		$('#chartTickersSpinner').show();
            		setTimeout(() => {
            			chart.validateData();
            			$('.chart-button').show();
            			$('#chartTickersSpinner').hide();
            		}, 500);
                    break;
                case 'chartWeekButton':
                    if (currentChartDataSet === 'chartWeekButton') {
                        return;
                    }
                    currentChartDataSet = 'chartWeekButton';
                    //chart.zoomOut();
                    let bufw = [...chartDataFull];
                    let dataw = [];
                    while (bufw.length > 0) {
                        let min = 999999999999999999;
                        let max = 0;
                        const nw = bufw.length >= 7 ? 6 : bufw.length - 1;
                        for (let i = 0; i < nw + 1; i++) {
                            if (bufw[i].high > max) {
                                max = bufw[i].high;
                            }
                            if (bufw[i].low < min) {
                                min = bufw[i].low;
                            }
                        }                        
                        const open = bufw[0].open;
                        const close = bufw[nw].close;
                        const date = bufw[nw].date || bufw[0].date;
                        for (let i = 0; i < nw + 1; i++) {
                            bufw.shift();
                        }
                        dataw.push({
                            value: close,
                            open: open,
                            close: close,
                            high: max,
                            low: min,
                            date: date
                        });
                        //break;
                    }
                    chartData = dataw;
                    chart.dataProvider = chartData;
                    $('.chart-button').hide();
            		$('#chartTickersSpinner').show();
            		setTimeout(() => {
            			chart.validateData();
            			$('.chart-button').show();
            			$('#chartTickersSpinner').hide();
            		}, 500);
                    break;
            }
        });
        $('#tickers>thead>tr>th').each(function() {
            $(this).html($(this).html().replace(/\s/gm, '&nbsp;'));
        });
        currentTicker = window.localStorage.getItem('currentTicker') ? JSON.parse(window.localStorage.getItem('currentTicker')) : {};
        $(window).bind('popstate',
            (event) => {
                processState(event.originalEvent.state);
            });
        $.getScript(`/api/lang/brb/${locale}.js`).done(() => {
            $('.zoia-loading').hide();
            $('.zoia-wrap-info').show();
            $('#tickers').zoiaTable({
                offline: true,
                offlineData: tickers,
                limit: 1000,
                sort: {
                    field: 'ticker',
                    direction: 'desc'
                },
                fields: {
                    ticker: {
                        sortable: true,
                        process: (id, item, value) => {
                            return `<a za-tooltip="title: ${item.full_name};pos:top-left" href="" class="zoia-ticker-link" data='${JSON.stringify(item)}'>${value}</a>`;
                        }
                    },
                    position_date: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    position_time: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    price: {
                        sortable: true,
                        process: (id, item, value) => {
                            return '$' + value;
                        }
                    },
                    position_value: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    position: {
                        sortable: false,
                        process: (id, item, value) => {
                            return item.position_value < 0 ? lang['Short'] : lang['Long'];
                        }
                    },
                    average_price: {
                        sortable: true,
                        process: (id, item, value) => {
                            return '$' + parseFloat(value).toFixed(2);
                        }
                    },
                    market_price: {
                        sortable: true,
                        process: (id, item, value) => {
                            return (parseFloat(value) < 0 ? '-$' : '$') + Math.abs(parseFloat(value).toFixed(2));
                        }
                    },
                    unrealized: {
                        sortable: true,
                        process: (id, item, value) => {
                            return (parseFloat(value) < 0 ? '-$' : '$') + Math.abs(parseFloat(value).toFixed(2));
                        }
                    },
                    position_prc: {
                        sortable: false,
                        process: (id, item, value) => {
                            const val = parseFloat(item.market_price / info.portfolio_cost * 100).toFixed(2);
                            return (parseFloat(val) < 0 ? '-$' : '$') + Math.abs(val);
                        }
                    },
                    tp: {
                        sortable: true,
                        process: (id, item, value) => {
                            return (parseFloat(value) < 0 ? '-$' : '$') + Math.abs(parseFloat(value).toFixed(2));
                        }
                    },
                    sl: {
                        sortable: true,
                        process: (id, item, value) => {
                            return (parseFloat(value) < 0 ? '-$' : '$') + Math.abs(parseFloat(value).toFixed(2));
                        }
                    },
                    potpro: {
                        sortable: false,
                        process: (id, item, value) => {
                            const val = parseFloat((item.tp - item.average_price) * item.position_value).toFixed(2);
                            return '$' + Math.abs(val);
                        }
                    },
                    potlos: {
                        sortable: false,
                        process: (id, item, value) => {
                            const val = parseFloat((item.sl - item.average_price) * item.position_value).toFixed(2);
                            return '$' + Math.abs(val);
                        }
                    },
                    protolos: {
                        sortable: false,
                        process: (id, item, value) => {
                            const pro = (item.tp - item.average_price) * item.position_value;
                            const los = (item.sl - item.average_price) * item.position_value;
                            return parseFloat(Math.abs(pro / los)).toFixed(2);
                        }
                    }
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            });
            $('.zoia-ticker-link').click(function(e) {
                e.preventDefault();
                window.history.pushState({
                    action: 'ticker'
                }, document.title, uprefix + '/brb');
                window.localStorage.setItem('currentTicker', $(this).attr('data'));
                zoiaTickerLinkClickHandler(JSON.parse($(this).attr('data')));
            });
            $.ajax({
                type: 'GET',
                url: '/api/brb/getChartData',
                cache: false
            }).done((res) => {
                if (res && res.status === 1) {
                    chartData = res.chartData;
                    chartDataFull = chartData.slice(0);
                    chartData.map((item, i) => {
                        item.value = item.close || 0;
                        return item;
                    });
                    for (let i = 1; i < 11; i++) {
                        chartData.push({
                            date: moment().add(i, 'days').format('YYYY-MM-DD')
                        });
                    }
                    chart = AmCharts.makeChart('chartTickers', {
                        'type': 'serial',
                        'theme': 'light',
                        'dataDateFormat': 'YYYY-MM-DD',
                        'valueAxes': [{
                            'position': 'left'
                        }],
                        'marginRight': 70,
                        'graphs': [{
                            'id': 'g1',
                            'balloonText': `${lang['Open']}: <b>$[[open]]</b><br>${lang['Low']}: <b>$[[low]]</b><br>${lang['High']}: <b>$[[high]]</b><br>${lang['Close']}: <b>$[[close]]</b><br>[[dynText]]`,
                            'closeField': 'close',
                            'fillColors': '#50ba27',
                            'highField': 'high',
                            'lineColor': '#50ba27',
                            'lineAlpha': 1,
                            'lowField': 'low',
                            'fillAlphas': 0.9,
                            'negativeFillColors': '#db4c3c',
                            'negativeLineColor': '#db4c3c',
                            'openField': 'open',
                            'title': 'Price:',
                            'type': 'candlestick',
                            'valueField': 'close'
                        }, {
                            'id': 'g2',
                            'balloon': {
                                'drop': false,
                                'adjustBorderColor': false,
                                'color': '#fff',
                            },
                            'bullet': 'round',
                            'bulletBorderAlpha': 1,
                            'bulletColor': '#FFFFFF',
                            'lineColor': '#444444',
                            'lineAlpha': 0.5,
                            'bulletSize': 5,
                            'hideBulletsCount': 50,
                            'lineThickness': 2,
                            'title': 'red line',
                            'useLineColorForBulletBorder': true,
                            'valueField': 'value',
                            'balloonText': '<span>$[[value]]</span>'
                        }],
                        'chartScrollbar': {
                            'graph': 'g2',
                            'graphType': 'line',
                            'scrollbarHeight': 30
                        },
                        'chartCursor': {
                            'valueLineEnabled': true,
                            'valueLineBalloonEnabled': true
                        },
                        'categoryField': 'date',
                        'categoryAxis': {
                            'parseDates': true
                        },
                        'dataProvider': chartData,
                        'listeners': [{
                            'event': 'zoomed',
                            'method': (e) => {
                                $('.chart-button').show();
                                $('#chartTickersSpinner').hide();
                                chartData.map((item, i) => {
                                    item.value = item.close || null;
                                    item.dyn1 = item.close ? item.close - chartData[i > 0 ? i - 1 : i].close : 0;
                                    const prc1 = item.dyn1 / item.open * 100;
                                    item.dyn2 = item.close && chartData[e.startIndex].close ? item.close - chartData[e.startIndex].close : 0;
                                    const prc2 = item.dyn2 / item.open * 100;
                                    item.dynText = `<span class="za-text-bold ${item.dyn1 >= 0 ? 'za-text-success' : 'za-text-danger'}">${item.dyn1 > 0 ? '+' : item.dyn1 === 0 ? '' : '-'}$${parseFloat(Math.abs(item.dyn1)).toFixed(2)}</span><br>${lang['From previous']}: <span class="${prc1 >= 0 ? 'za-text-success' : 'za-text-danger'}">${prc1 > 0 ? '+' : prc1 === 0 ? '' : '-'}${parseFloat(Math.abs(prc1)).toFixed(2)}%</span><br>${lang['Since']} ${chartData[e.startIndex].date} <span class="${prc2 >= 0 ? 'za-text-success' : 'za-text-danger'}">${prc2 > 0 ? '+' : prc2 === 0 ? '' : '-'}${parseFloat(Math.abs(prc2)).toFixed(2)}%</span>`;
                                    return item;
                                });
                            }
                        }]
                    });
                } else {
                    $('#chartTickers').html(lang['Could not fetch information from API.'] + ' (code 1)');
                }
            }).fail(() => {
                $('#chartTickers').html(lang['Could not fetch information from API.'] + ' (code 2)');
            });
        });
    });
})();