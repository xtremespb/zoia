/* eslint no-console:0 */
import colors from 'colors';

const install = async db => {
    console.log(`${colors.green(' * ')} Inserting or updating default pages...`);
    await db.collection('pages').updateOne({
        fullPath: '/'
    }, {
        $set: {
            path: '/',
            filename: '',
            fullPath: '/',
            template: 'zoia',
            data: {
                en: {
                    title: 'Home Page',
                    content: '<div class="uk-title-head">Home</div>\n<p>Zoia has been installed successfully. Go to <a href="/admin">admin panel</a> to get things done.</p>',
                    contentCompiled: '<div class="uk-title-head">Home</div><p>Zoia has been installed successfully. Go to <a href="/admin">admin panel</a> to get things done.</p>'
                },
                ru: {
                    title: 'Главная',
                    content: '<div class="uk-title-head">Главная</div>\n<p>Инсталляция Zoia успешно завершена. Вы можете перейти к <a href="/admin">панели администратора</a> для завершения настройки.</p>',
                    contentCompiled: '<div class="uk-title-head">Главная</div><p>Инсталляция Zoia успешно завершена. Вы можете перейти к <a href="/admin">панели администратора</a> для завершения настройки.</p>'
                }
            }
        }
    }, {
        upsert: true
    });
    await db.collection('pages').updateOne({
        fullPath: '/license'
    }, {
        $set: {
            path: '/',
            filename: 'license',
            fullPath: '/license',
            template: 'zoia',
            data: {
                en: {
                    title: 'License',
                    content: '<div class="uk-title-head">License</div>\n<p class="uk-text-bold">MIT License<p>\n<p>Copyright (c) 2019-2020 Michael Matveev</p>\n<p>Permission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:</p>\n<p>The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.</p>\n<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.</p>',
                    contentCompiled: '<div class="uk-title-head">License</div><p class="uk-text-bold">MIT License</p><p></p><p>© 2019-2020 Michael Matveev</p><p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p><p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p><p>THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>'
                },
                ru: {
                    title: 'Лицензия',
                    content: '<div class="uk-title-head">Лицензия</div>\n<p class="uk-text-bold">Лицензия MIT<p>\n<p>Copyright (c) 2019-2020 Michael Matveev</p>\n<p>Данная лицензия разрешает лицам, получившим копию данного программного обеспечения и\nсопутствующей документации (в дальнейшем именуемыми «Программное обеспечение»), \nбезвозмездно использовать Программное обеспечение без ограничений, включая \nнеограниченное право на использование, копирование, изменение, слияние, публикацию, \nраспространение, сублицензирование и/или продажу копий Программного обеспечения, а также лицам, \nкоторым предоставляется данное Программное обеспечение, при соблюдении следующих условий:</p>\n<p>Указанное выше уведомление об авторском праве и данные условия должны быть включены \nво все копии или значимые части данного Программного обеспечения.</p>\n<p>ДАННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ», БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, \nЯВНО ВЫРАЖЕННЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ, ВКЛЮЧАЯ ГАРАНТИИ ТОВАРНОЙ ПРИГОДНОСТИ, СООТВЕТСТВИЯ \nПО ЕГО КОНКРЕТНОМУ НАЗНАЧЕНИЮ И ОТСУТСТВИЯ НАРУШЕНИЙ, НО НЕ ОГРАНИЧИВАЯСЬ ИМИ. НИ В КАКОМ \nСЛУЧАЕ АВТОРЫ ИЛИ ПРАВООБЛАДАТЕЛИ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ПО КАКИМ-ЛИБО ИСКАМ, ЗА УЩЕРБ ИЛИ \nПО ИНЫМ ТРЕБОВАНИЯМ, В ТОМ ЧИСЛЕ, ПРИ ДЕЙСТВИИ КОНТРАКТА, ДЕЛИКТЕ ИЛИ ИНОЙ СИТУАЦИИ, ВОЗНИКШИМ \nИЗ-ЗА ИСПОЛЬЗОВАНИЯ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ ИЛИ ИНЫХ ДЕЙСТВИЙ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ.</p>',
                    contentCompiled: '<div class="uk-title-head">Лицензия</div>\n<p class="uk-text-bold">Лицензия MIT<p>\n<p>Copyright (c) 2019-2020 Michael Matveev</p>\n<p>Данная лицензия разрешает лицам, получившим копию данного программного обеспечения и\nсопутствующей документации (в дальнейшем именуемыми «Программное обеспечение»), \nбезвозмездно использовать Программное обеспечение без ограничений, включая \nнеограниченное право на использование, копирование, изменение, слияние, публикацию, \nраспространение, сублицензирование и/или продажу копий Программного обеспечения, а также лицам, \nкоторым предоставляется данное Программное обеспечение, при соблюдении следующих условий:</p>\n<p>Указанное выше уведомление об авторском праве и данные условия должны быть включены \nво все копии или значимые части данного Программного обеспечения.</p>\n<p>ДАННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ», БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, \nЯВНО ВЫРАЖЕННЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ, ВКЛЮЧАЯ ГАРАНТИИ ТОВАРНОЙ ПРИГОДНОСТИ, СООТВЕТСТВИЯ \nПО ЕГО КОНКРЕТНОМУ НАЗНАЧЕНИЮ И ОТСУТСТВИЯ НАРУШЕНИЙ, НО НЕ ОГРАНИЧИВАЯСЬ ИМИ. НИ В КАКОМ \nСЛУЧАЕ АВТОРЫ ИЛИ ПРАВООБЛАДАТЕЛИ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ПО КАКИМ-ЛИБО ИСКАМ, ЗА УЩЕРБ ИЛИ \nПО ИНЫМ ТРЕБОВАНИЯМ, В ТОМ ЧИСЛЕ, ПРИ ДЕЙСТВИИ КОНТРАКТА, ДЕЛИКТЕ ИЛИ ИНОЙ СИТУАЦИИ, ВОЗНИКШИМ \nИЗ-ЗА ИСПОЛЬЗОВАНИЯ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ ИЛИ ИНЫХ ДЕЙСТВИЙ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ.</p>'
                }
            }
        }
    }, {
        upsert: true
    });
};

export default install;
