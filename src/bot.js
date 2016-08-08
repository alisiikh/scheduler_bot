'use strict';

const botCfg = require('./config').bot;
const botBuilder = require('botbuilder');

const botConnector = new botBuilder.ChatConnector({
    appId: botCfg.botAppId,
    appPassword: botCfg.botAppSecret
});

const bot = new botBuilder.UniversalBot(botConnector);

botBuilder.Middleware.convertSkypeGroupMessages = function() {
    return {
        botbuilder: function (session, next) {
            let message = session.message;
            let address = message.address;

            if (address.channelId === "skype" && address.conversation.isGroup) {
                if (message.entities.length > 0) {
                    let content = message.text;

                    message.entities.forEach((entity) => {
                        content = message.text.replace(entity.text, "");
                    });

                    session.message.text = content.trim();
                }
            }

            next();
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
