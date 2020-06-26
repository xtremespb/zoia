export default {
    telegramReplyWithMarkdown: (ctx, message) => ctx.replyWithMarkdown(message),
    telegramSendMessage: async (telegramBot, userId, message) => telegramBot.telegram.sendMessage(userId, message)
};
