/* eslint no-console:0 */
import path from 'path';
import inquirer from 'inquirer';
import commandLineArgs from 'command-line-args';
import colors from 'colors/safe';
import fs from 'fs-extra';
import gettextParser from 'gettext-parser';
import cloneDeep from 'lodash/cloneDeep';
import {
    MongoClient
} from 'mongodb';

let db;
const optionDefinitions = [{
    name: 'install',
    alias: 'i',
    type: Boolean
}, {
    name: 'defaults',
    alias: 'r',
    type: Boolean
}, {
    name: 'split',
    alias: 's',
    type: Boolean
}, {
    name: 'combine',
    alias: 'c',
    type: Boolean
}, {
    name: 'cleanup',
    alias: 'd',
    type: Boolean
}, {
    name: 'silent',
    alias: 'f',
    type: Boolean
}];
const options = commandLineArgs(optionDefinitions);

const splitLocales = () => {
    console.log(`${colors.green(' * ')} Spliting locales...`);
    ['admin'].map(t => {
        console.log(`${colors.green(' * ')} Processing area: ${t}`);
        const locales = fs.readdirSync(`${__dirname}/../shared/react/locales/${t}`);
        locales.filter(l => l !== '_build').map(locale => {
            console.log(`${colors.green(' * ')} Processing locale: ${locale}`);
            const transModules = {};
            const input = fs.readFileSync(`${__dirname}/../shared/react/locales/${t}/${locale}/messages.po`);
            const po = gettextParser.po.parse(input);
            const trans = po.translations[''];
            Object.keys(trans).map(i => {
                if (i && i.length && trans[i] && trans[i].comments) {
                    const {
                        reference
                    } = trans[i].comments;
                    if (reference) {
                        const refArr = reference.split(/\n/);
                        refArr.map(m => {
                            const ms = m.split(/\//);
                            const area = ms[1];
                            if (!transModules[area]) {
                                transModules[area] = {};
                            }
                            transModules[area][i] = trans[i];
                        });
                    }
                }
            });
            Object.keys(transModules).map(m => {
                const module = m === 'react' ? 'core' : m;
                console.log(`${colors.green(' * ')} Processing module: ${module}`);
                const dir = `${__dirname}/../modules/${module}/locales/${t}/${locale}`;
                const filename = `${__dirname}/../modules/${module}/locales/${t}/${locale}/messages.po`;
                fs.ensureDirSync(dir);
                const data = gettextParser.po.compile({
                    charset: po.charset,
                    headers: po.headers,
                    translations: {
                        '': transModules[m]
                    }
                });
                fs.writeFileSync(filename, data);
            });
        });
    });
};

const combineLocales = () => {
    const modules = Object.keys(require('../build/modules.json'));
    console.log(`${colors.green(' * ')} Combining locales...`);
    ['admin'].map(t => {
        const locales = fs.readdirSync(`${__dirname}/../shared/react/locales/admin`);
        let charset;
        let headers;
        locales.filter(l => l !== '_build').map(locale => {
            const messagesTrans = {};
            modules.map(m => {
                if (!fs.existsSync(`${__dirname}/../modules/${m}/locales/${t}/${locale}/messages.po`)) {
                    return;
                }
                const messagesModule = fs.readFileSync(`${__dirname}/../modules/${m}/locales/${t}/${locale}/messages.po`);
                const messagesModulePo = gettextParser.po.parse(messagesModule);
                charset = charset || messagesModulePo.charset;
                headers = headers || messagesModulePo.headers;
                const messagesModuleTrans = messagesModulePo.translations[''];
                Object.keys(messagesModuleTrans).map(mmt => {
                    if (!messagesTrans[mmt]) {
                        messagesTrans[mmt] = messagesModuleTrans[mmt];
                    }
                });
            });
            const data = gettextParser.po.compile({
                charset,
                headers,
                translations: {
                    '': messagesTrans
                }
            });
            fs.writeFileSync(`${__dirname}/../shared/react/locales/${t}/${locale}/messages.po`, data);
        });
    });
};

const cleanupLocales = () => {
    const modules = Object.keys(require('../build/modules.json'));
    console.log(`${colors.green(' * ')} Cleaning up combined locales...`);
    ['admin'].map(t => {
        console.log(`${colors.green(' * ')} Processing area: ${t}`);
        const locales = fs.readdirSync(`${__dirname}/../shared/react/locales/${t}`);
        locales.filter(l => l !== '_build').map(locale => {
            console.log(`${colors.green(' * ')} Processing locale: ${locale}`);
            const input = fs.readFileSync(`${__dirname}/../shared/react/locales/${t}/${locale}/messages.po`);
            const po = gettextParser.po.parse(input);
            const trans = cloneDeep(po.translations['']);
            Object.keys(trans).map(item => {
                if (trans[item].comments && trans[item].comments.reference) {
                    const references = trans[item].comments.reference.split(/\n/).filter(ref => {
                        const [sign, module] = ref.split(/\//);
                        if (sign === 'modules' && module && modules.indexOf(module) === -1) {
                            return false;
                        }
                        return true;
                    });
                    if (references.length) {
                        po.translations[''][item].comments.reference = references.join(/\n/);
                    } else {
                        delete po.translations[''][item];
                    }
                }
            });
            const data = gettextParser.po.compile({
                charset: po.charset,
                headers: po.headers,
                translations: po.translations
            });
            fs.writeFileSync(`${__dirname}/../shared/react/locales/${t}/${locale}/messages.po`, data);
        });
    });
};

const install = async () => {
    const secure = fs.readJsonSync(path.resolve(`${__dirname}/../etc/secure.json`));
    const modules = Object.keys(require('../build/modules.json'));
    const questions = [{
        type: 'rawlist',
        name: 'install',
        message: 'Which modules to process?',
        choices: ['All', 'None', ...modules],
        default: 'All'
    }];
    try {
        console.log(`This tool will run the module installation scripts.`);
        console.log(`Modules available: ${modules.join(', ')}`);
        console.log('');
        const data = options.silent ? {
            install: 'All'
        } : (await inquirer.prompt(questions));
        console.log('');
        const mongoClient = new MongoClient(secure.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        db = mongoClient.db(secure.mongo.dbName);
        if (data.install !== 'None') {
            await Promise.all((data.install === 'All' ? modules : [data.install]).map(async m => {
                console.log(`${colors.green(' * ')} Processing module: ${m}...`);
                try {
                    const moduleDatabaseConfig = require(`../../modules/${m}/database.json`);
                    const collections = Object.keys(moduleDatabaseConfig.collections);
                    if (collections.length) {
                        await Promise.all(collections.map(async c => {
                            console.log(`${colors.green(' * ')} Creating collection: ${c}...`);
                            try {
                                await db.createCollection(c);
                            } catch (e) {
                                console.log(`${colors.green(' ! ')} Collection is not created: ${c} (already exists?)`);
                            }
                            const {
                                indexesAsc,
                                indexesDesc,
                                expires
                            } = moduleDatabaseConfig.collections[c];
                            const languages = fs.readdirSync(`${__dirname}/../shared/react/locales/admin`).filter(i => i !== '_build');
                            if (indexesAsc && indexesAsc.length) {
                                console.log(`${colors.green(' * ')} Creating ASC indexes for collection: ${c}...`);
                                const indexes = {};
                                indexesAsc.map(i => {
                                    if (i.match(/\[language\]/i)) {
                                        languages.map(language => {
                                            const index = i.replace(/\[language\]/i, language);
                                            indexes[index] = 1;
                                        });
                                    } else {
                                        indexes[i] = 1;
                                    }
                                });
                                try {
                                    await db.collection(c).createIndex(indexes, {
                                        name: `${m}_asc`
                                    });
                                } catch (e) {
                                    console.log('');
                                    console.log(colors.red(e));
                                    process.exit(1);
                                }
                            }
                            if (indexesDesc && indexesDesc.length) {
                                console.log(`${colors.green(' * ')} Creating DESC indexes for collection: ${c}...`);
                                const indexes = {};
                                indexesDesc.map(i => {
                                    if (i.match(/\[language\]/i)) {
                                        languages.map(language => {
                                            const index = i.replace(/\[language\]/i, language);
                                            indexes[index] = -1;
                                        });
                                    } else {
                                        indexes[i] = -1;
                                    }
                                });
                                try {
                                    await db.collection(c).createIndex(indexes, {
                                        name: `${m}_desc`
                                    });
                                } catch (e) {
                                    console.log('');
                                    console.log(colors.red(e));
                                    process.exit(1);
                                }
                            }
                            if (expires) {
                                console.log(`${colors.green(' * ')} Creating expiration index for collection: ${c}...`);
                                try {
                                    await db.collection(c).createIndex({
                                        createdAt: 1
                                    }, {
                                        expireAfterSeconds: parseInt(expires, 10)
                                    }, {
                                        name: `${m}_exp`
                                    });
                                } catch (e) {
                                    console.log('');
                                    console.log(colors.red(e));
                                    process.exit(1);
                                }
                            }
                        }));
                    }
                } catch (e) {
                    // Ignore
                }
                try {
                    console.log(`${colors.green(' * ')} Running installation script for module: ${m}...`);
                    const installScript = require(`../../modules/${m}/install.js`);
                    await installScript.default(db);
                } catch (e) {
                    // Ignore
                }
            }));
        }
        console.log(`${colors.green(' * ')} Done`);
        mongoClient.close();
    } catch (e) {
        console.log('');
        console.log(colors.red(e));
        process.exit(1);
    }
};

const defaults = async () => {
    const secure = fs.readJsonSync(path.resolve(`${__dirname}/../etc/secure.json`));
    const modules = Object.keys(require('../build/modules.json'));
    const questions = [{
        type: 'rawlist',
        name: 'install',
        message: 'Which modules to process?',
        choices: ['All', 'None', ...modules],
        default: 'All'
    }];
    try {
        console.log(`This tool will set default values and settings for modules.`);
        console.log(`Modules available: ${modules.join(', ')}`);
        console.log('');
        const data = options.silent ? {
            install: 'All'
        } : (await inquirer.prompt(questions));
        console.log('');
        const mongoClient = new MongoClient(secure.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        db = mongoClient.db(secure.mongo.dbName);
        if (data.install !== 'None') {
            await Promise.all((data.install === 'All' ? modules : [data.install]).map(async m => {
                console.log(`${colors.green(' * ')} Processing module: ${m}...`);
                try {
                    console.log(`${colors.green(' * ')} Running defaults script for module: ${m}...`);
                    const installScript = require(`../../modules/${m}/defaults.js`);
                    await installScript.default(db);
                } catch (e) {
                    // Ignore
                }
            }));
        }
        console.log(`${colors.green(' * ')} Done`);
        mongoClient.close();
    } catch (e) {
        console.log('');
        console.log(colors.red(e));
        process.exit(1);
    }
};

console.log(colors.green.inverse('\n                                      '));
console.log(colors.green.inverse(' Zoia Helper Scripts                  '));
console.log(colors.green.inverse('                                      \n'));

// Do we need to split locales?
if (options.split) {
    splitLocales();
    console.log(`${colors.green(' * ')} Done`);
    process.exit(0);
}

// Do we need to combine locales?
if (options.combine) {
    combineLocales();
    console.log(`${colors.green(' * ')} Done`);
    process.exit(0);
}

// Do we need to clean up locales?
if (options.cleanup) {
    cleanupLocales();
    console.log(`${colors.green(' * ')} Done`);
    process.exit(0);
}

// Do we need to install?
if (options.install) {
    install();
} else if (options.defaults) {
    defaults();
} else {
    console.log('Usage: node tools --install|--defaults|--split|--combine|--cleanup\n\n --install (-i): run Zoia installation\n --defaults(-r): set default values and settings for a module\n --split (-s): split locales from shared directory to module directories\n --combine locales from module directories to shared directory\n --cleanup (-d): remove unused locale entries from shared directory');
}
