/* eslint-disable no-console */
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const config = fs.readJSONSync(path.resolve(`${__dirname}/../package.json`));
console.log(`Building Relase package for Zoia version ${config.version}`);
fs.ensureDirSync(path.join(__dirname, '..', 'build'));
const output = fs.createWriteStream(path.resolve(`${__dirname}/../build/update.zip`));
const archive = archiver('zip', {
    zlib: {
        level: 9
    }
});
output.on('close', () => {
    console.log(`${archive.pointer()} total bytes`);
    console.log('Finished.');
});
archive.on('error', err => {
    throw err;
});
archive.pipe(output);
archive.directory(path.resolve(`${__dirname}/../src`), 'src');
archive.directory(path.resolve(`${__dirname}/../scripts`), 'scripts');
archive.append(fs.createReadStream(path.resolve(`${__dirname}/../package.json`)), { name: 'package.json' });
archive.append(fs.createReadStream(path.resolve(`${__dirname}/../package-lock.json`)), { name: 'package-lock.json' });
archive.finalize();
// exec('npm i --loglevel=error', (error, stdout, stderr) => {
