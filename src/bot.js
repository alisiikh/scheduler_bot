'use strict';

const botCfg = require('./config').bot;
const botBuilder = require('botbuilder');
const BotUtil = require('./util/botutil');

const botConnector = new botBuilder.ChatConnector({
    appId: botCfg.botAppId,
    appPassword: botCfg.botAppSecret
});

const bot = new botBuilder.UniversalBot(botConnector);

botBuilder.Middleware.processGroupMessages = function () {
    return {
        botbuilder: function (session, next) {
            const message = session.message;
            const address = message.address;

            if (address.conversation.isGroup) {
                let content = message.text;

                if (BotUtil.isBotMentioned(message)) {
                    if (address.channelId === "skype" || address.channelId === 'emulator') {
                        message.entities.filter((entity) => entity.mentioned && entity.mentioned.id === address.bot.id)
                            .forEach((entity) => {
                                let mentionedText = entity.text;
                                content = content.replace(mentionedText, "");
                            });

                        session.message.text = content.trim();
                    } else if (address.channelId === "telegram") {
                        message.entities.filter((entity) => entity.mentioned && entity.mentioned.id === address.bot.id)
                            .forEach((entity) => {
                                let mentionedText = content.substring(entity.offset, entity.length);
                                content = content.replace(mentionedText, "");
                            });

                        session.message.text = content.trim();
                    }

                    next();
                } else {
                    console.log("Bot received a group message, but was not mentioned, cancelling dialog!");
                    console.log(message);

                    // TODO: maybe there's a possibility to ignore user message instead of cancelling the whole dialog
                    session.cancelDialog();
                }
            } else {
                next();
            }
        }
    }
};

botBuilder.Middleware.ignoreNotDirectGroupMessages = function () {
    return {
        botbuilder: function (session, next) {
            let message = session.message;
            let address = message.address;

            if (address.conversation.isGroup) {
                session.endDialog();
            } else {
                next();
            }
        }
    };
};

module.exports = {
    bot,
    botBuilder,
    botConnector
};
