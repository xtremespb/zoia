/* eslint no-console:0 */
const fs = require('fs-extra');
const inquirer = require('inquirer');
const colors = require('colors/safe');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const path = require('path');

const install = async () => {
    const config = require('./config-source/config.json');
    const secure = require('./config-source/secure.json');
    const templates = require('./config-source/templates.json');
    const questions = [{
            type: 'input',
            name: 'ipAPI',
            message: 'Which IP address should API listen to?',
            default: secure.apiServer.ip,
        },
        {
            type: 'input',
            name: 'portAPI',
            message: 'Which port should API listen to?',
            default: secure.apiServer.port,
        },
        {
            type: 'input',
            name: 'ipWeb',
            message: 'Which IP address should Web Server listen to?',
            default: secure.webServer.ip,
        },
        {
            type: 'input',
            name: 'portWeb',
            message: 'Which port should WebServer listen to?',
            default: secure.webServer.port,
        },
        {
            type: 'input',
            name: 'apiURL',
            message: 'Which Zoia API URL to use?',
            default: config.api.url,
        },
        {
            type: 'input',
            name: 'user',
            message: 'User to run systemd startup script?',
            default: secure.user,
        },
        {
            type: 'input',
            name: 'group',
            message: 'Group to run systemd startup script?',
            default: secure.group,
        },
        {
            type: 'input',
            name: 'mongourl',
            message: 'Mongo server URL?',
            default: secure.mongo.url,
        },
        {
            type: 'input',
            name: 'mongodb',
            message: 'Mongo database name?',
            default: secure.mongo.dbName,
        },
        {
            type: 'input',
            name: 'serverName',
            message: 'Host name(s) for NGINX config?',
            default: secure.serverName,
        },
        {
            type: 'rawlist',
            name: 'loglevel',
            message: 'Which Log level to use?',
            choices: ['info', 'warn', 'error'],
            default: secure.loglevel,
        }
    ];
    try {
        console.log(`This script will generate the configuration files (config.json and secure.json).`);
        console.log('');
        const data = await inquirer.prompt(questions);
        console.log('');
        secure.apiServer.ip = data.ipAPI;
        secure.apiServer.port = data.portAPI;
        secure.webServer.ip = data.ipWeb;
        secure.webServer.port = data.portWeb;
        config.api.url = data.apiURL;
        secure.mongo.url = data.mongourl;
        secure.mongo.dbName = data.mongodb;
        secure.loglevel = data.loglevel;
        secure.secret = crypto.createHmac('sha256', uuid()).update(uuid()).digest('hex');
        // eslint-disable-next-line no-bitwise
        secure.randomInt = ~~(Math.random() * 9007199254740000) + 1;
        secure.user = data.user;
        secure.group = data.group;
        secure.serverName = data.serverName;
        console.log(`${colors.green(' * ')} Ensuring 'dist/etc' directory...`);
        fs.ensureDirSync(`${__dirname}/../dist/etc`);
        console.log(`${colors.green(' * ')} Ensuring 'dist/static/etc' directory...`);
        fs.ensureDirSync(`${__dirname}/../dist/static/etc`);
        console.log(`${colors.green(' * ')} Saving configuration to dist/static/etc/config.json file...`);
        fs.writeJSONSync(path.resolve(`${__dirname}/../dist/static/etc/config.json`), config, {
            spaces: 2
        });
        console.log(`${colors.green(' * ')} Saving configuration to dist/etc/secure.json file...`);
        fs.writeJSONSync(path.resolve(`${__dirname}/../dist/etc/secure.json`), secure, {
            spaces: 2
        });
        console.log(`${colors.green(' * ')} Saving configuration to dist/etc/templates.json file...`);
        fs.writeJSONSync(path.resolve(`${__dirname}/../dist/etc/templates.json`), templates, {
            spaces: 2
        });
        console.log(`${colors.green(' * ')} Done\n`);
    } catch (e) {
        console.log('');
        console.log(colors.red(e));
        process.exit(1);
    }
};

console.log(colors.green.inverse('\n                                      '));
console.log(colors.green.inverse(' Zoia Configurator                    '));
console.log(colors.green.inverse('                                      \n'));

install();
