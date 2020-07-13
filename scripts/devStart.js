const path = require('path');
const cp = require('child_process');

cp.fork(path.resolve(`${__dirname}/../dist/bin/api.js`));
cp.fork(path.resolve(`${__dirname}/../dist/bin/web.js`));
cp.fork(path.resolve(`${__dirname}/devServer.js`));
