export default language => {
    const {
        messages
    } = require(`../../locales/user/${language}/messages.js`);
    Object.keys(messages).map(k => messages[k] = messages[k] || k);
    return messages;
};
