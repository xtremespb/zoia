/* eslint no-console:0 */
import colors from 'colors';

const install = async db => {
    console.log(`${colors.green(' * ')} Inserting or updating navigation tree...`);
    await db.collection('registry').updateOne({
        _id: 'nav_folder_tree'
    }, {
        $set: {
            data: [{
                    data: {
                        en: {
                            title: 'Home'
                        },
                        ru: {
                            title: 'Главная'
                        }
                    },
                    url: '/',
                    key: '70e1c0e0fa5811e988275be86ae395c5'
                },
                {
                    data: {
                        en: {
                            title: 'License'
                        },
                        ru: {
                            title: 'Лицензия'
                        }
                    },
                    url: '/license',
                    key: '78a62050fa5811e98988895204e95362'
                }
            ]
        }
    }, {
        upsert: true
    });
};

export default install;
