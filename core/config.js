const path = require('path');
const configMain = require(path.join(__dirname, '..', 'etc', 'config.json'));
const configWebsite = require(path.join(__dirname, '..', 'etc', 'website.json'));
const packageJSON = require(path.join(__dirname, '..', 'package.json'));

let config = configMain;
config.website = configWebsite;
config.version = packageJSON.version;

module.exports = config;