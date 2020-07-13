const path = require('path');
const config = require(path.join(__dirname, '..', 'core', 'config.js'));
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(config.mailer);
let db;

const send = (mailOptions) => {
    return new Promise(function(resolve, reject) {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info.messageId);
            }
        });
    });
};

const checkDatabase = async() => {
    try {
        let item = await db.collection('mail').findAndModify({}, [], {}, { remove: true });
        if (item && item.ok && item.value) {
            await send(item.value);
        }
    } catch (e) {
        console.log(e);
    }
    setTimeout(checkDatabase, 1000);
};

const init = async() => {
    const database = new(require(path.join(__dirname, '..', 'core', 'database.js')))(false, config.mongo, false);
    await database.connect();
    db = database.get();
    checkDatabase();
};

init();