/* eslint max-len: 0 */

module.exports = function(data) {
    return async() => {
        const db = data.db;
        console.log('  └── Creating collection: navigation...');
        try {
            await db.createCollection('navigation');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('navigation').dropIndexes();
        } catch (e) {
            console.log('      [ ] Some Indexes were not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('navigation').createIndex({ name: 1 });
        await db.collection('navigation').createIndex({ name: -1 });
        console.log('      Creating default navigation...');
        let upd = await db.collection('navigation').update({ name: 'navigation' }, {
            $set: {
                name: 'navigation',
                data: '{"en":[{"id":"j1_1","text":"/","parent":"#","type":"root"},{"id":"j2_1","text":"Home","data":{"url":"/"},"parent":"j1_1","type":"folder"},{"id":"j2_2","text":"Manual","data":{"url":"/manual"},"parent":"j1_1","type":"folder"},{"id":"j2_4","text":"Installation","data":{"url":"/manual/installation"},"parent":"j2_2","type":"folder"},{"id":"j2_3","text":"Configuration","data":{"url":"/manual/configuration"},"parent":"j2_2","type":"folder"},{"id":"j2_5","text":"Development","data":{"url":"/development"},"parent":"j1_1","type":"folder"}],' +
                    '"ru":[{"id":"j1_1","text":"/","parent":"#","type":"root"},{"id":"j4_1","text":"Главная","data":{"url":"/"},"parent":"j1_1","type":"folder"},{"id":"j4_2","text":"Документация","data":{"url":"/manual"},"parent":"j1_1","type":"folder"},{"id":"j4_4","text":"Установка","data":{"url":"/manual/installation"},"parent":"j4_2","type":"folder"},{"id":"j4_3","text":"Конфигурация","data":{"url":"/manual/configuration"},"parent":"j4_2","type":"folder"},{"id":"j4_5","text":"Поддержка","data":{"url":"/development"},"parent":"j1_1","type":"folder"}],' +
                    '"sr":[{"id":"j1_1","text":"/","parent":"#","type":"root"},{"id":"j6_1","text":"Почетна","data":{"url":"/"},"parent":"j1_1","type":"folder"},{"id":"j6_2","text":"Документација","data":{"url":"/manual"},"parent":"j1_1","type":"folder"},{"id":"j6_4","text":"Уградња","data":{"url":"/manual/installation"},"parent":"j6_2","type":"folder"},{"id":"j6_3","text":"Подешавање","data":{"url":"/manual/configuration"},"parent":"j6_2","type":"folder"},{"id":"j6_5","text":"Развој","data":{"url":"/development"},"parent":"j1_1","type":"folder"}]' +
                    '}'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_d_en' }, {
            $set: {
                name: 'navigation_html_d_en',
                data: '<li><a href=\'/\'>Home</a></li><li><a href=\'#\'>Manual&nbsp;<span za-icon=\'icon:chevron-down\'></span></a><div class=\'za-navbar-dropdown\'><ul class=\'za-nav za-navbar-dropdown-nav\'><li><a href=\'/manual/installation\'>Installation</a></li><li><a href=\'/manual/configuration\'>Configuration</a></li></ul></div></li><li><a href=\'/development\'>Development</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_m_en' }, {
            $set: {
                name: 'navigation_html_m_en',
                data: '<li><a href=\'/\'>Home</a></li><li class=\'za-parent\'><a href=\'#\'>Manual</a><ul class=\'za-nav-sub\'><li><a href=\'/manual/installation\'>Installation</a></li><li><a href=\'/manual/configuration\'>Configuration</a></li></ul></li><li><a href=\'/development\'>Development</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_d_ru' }, {
            $set: {
                name: 'navigation_html_d_ru',
                data: '<li><a href=\'/\'>Главная</a></li><li><a href=\'#\'>Документация&nbsp;<span za-icon=\'icon:chevron-down\'></span></a><div class=\'za-navbar-dropdown\'><ul class=\'za-nav za-navbar-dropdown-nav\'><li><a href=\'/manual/installation\'>Установка</a></li><li><a href=\'/manual/configuration\'>Конфигурация</a></li></ul></div></li><li><a href=\'/development\'>Разработка</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_m_ru' }, {
            $set: {
                name: 'navigation_html_m_ru',
                data: '<li><a href=\'/\'>Главная</a></li><li class=\'za-parent\'><a href=\'#\'>Документация</a><ul class=\'za-nav-sub\'><li><a href=\'/manual/installation\'>Установка</a></li><li><a href=\'/manual/configuration\'>Конфигурация</a></li></ul></li><li><a href=\'/development\'>Разработка</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_d_sr' }, {
            $set: {
                name: 'navigation_html_d_sr',
                data: '<li><a href=\'/\'>Почетна</a></li><li><a href=\'#\'>Документација&nbsp;<span za-icon=\'icon:chevron-down\'></span></a><div class=\'za-navbar-dropdown\'><ul class=\'za-nav za-navbar-dropdown-nav\'><li><a href=\'/manual/installation\'>Уградња</a></li><li><a href=\'/manual/configuration\'>Подешавање</a></li></ul></div></li><li><a href=\'/development\'>Развој</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        upd = await db.collection('navigation').update({ name: 'navigation_html_m_sr' }, {
            $set: {
                name: 'navigation_html_m_sr',
                data: '<li><a href=\'/\'>Почетна</a></li><li class=\'za-parent\'><a href=\'#\'>Документација</a><ul class=\'za-nav-sub\'><li><a href=\'/manual/installation\'>Уградња</a></li><li><a href=\'/manual/configuration\'>Подешавање</a></li></ul></li><li><a href=\'/development\'>Развој</a></li>'
            }
        }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'navigation\').update');
        }
        console.log('      Module is installed!');
    };
};