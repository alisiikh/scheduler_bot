'use strict';

import * as botBuilder from 'botbuilder';
import { bot as botConfig } from './config';

// const BotUtil = require('./botutil');

const connector = new botBuilder.ChatConnector({
    appId: botConfig.botAppId,
    appPassword: botConfig.botAppSecret
});

const bot = new botBuilder.UniversalBot(connector);

class MongoBotStorage {
    constructor() {
        this.userStore = {};
        this.conversationStore = {};
    }

    getData(context, callback) {
        const data = {};
        if (context.userId) {
            if (context.persistUserData) {
                if (this.userStore.hasOwnProperty(context.userId)) {
                    data.userData = JSON.parse(this.userStore[context.userId]);
                }
                else {
                    data.userData = null;
                }
            }
            if (context.conversationId) {
                const key = context.userId + ':' + context.conversationId;
                if (this.conversationStore.hasOwnProperty(key)) {
                    data.privateConversationData = JSON.parse(this.conversationStore[key]);
                }
                else {
                    data.privateConversationData = null;
                }
            }
        }
        if (context.persistConversationData && context.conversationId) {
            if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                data.conversationData = JSON.parse(this.conversationStore[context.conversationId]);
            }
            else {
                data.conversationData = null;
            }
        }
        callback(null, data);
    }

    deleteData(context) {
        if (context.userId && this.userStore.hasOwnProperty(context.userId)) {
            if (context.conversationId) {
                if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                    delete this.conversationStore[context.conversationId];
                }
            }
            else {
                delete this.userStore[context.userId];
                for (const key in this.conversationStore) {
                    if (key.indexOf(context.userId + ':') === 0) {
                        delete this.conversationStore[key];
                    }
                }
            }
        }
    }

    saveData(context, data, callback) {

        console.log(data);

        if (context.userId) {
            if (context.persistUserData) {
                this.userStore[context.userId] = JSON.stringify(data.userData || {});
            }
            if (context.conversationId) {
                var key = context.userId + ':' + context.conversationId;
                this.conversationStore[key] = JSON.stringify(data.privateConversationData || {});
            }
        }
        if (context.persistConversationData && context.conversationId) {
            this.conversationStore[context.conversationId] = JSON.stringify(data.conversationData || {});
        }
        callback(null);
    }
}

const botStorage = new MongoBotStorage();
bot.set('storage', botStorage);

// botBuilder.Middleware.processGroupMessages = function () {
//     return {
//         botbuilder: function (session, next) {
//             const message = session.message;
//             const address = message.address;
//
//             if (address.conversation.isGroup) {
//                 let content = message.text;
//
//                 if (BotUtil.isBotMentioned(message)) {
//                     if (address.channelId === "skype" || address.channelId === 'emulator') {
//                         message.entities.filter((entity) => entity.mentioned && entity.mentioned.id === address.bot.id)
//                             .forEach((entity) => {
//                                 let mentionedText = entity.text;
//                                 content = content.replace(mentionedText, "");
//                             });
//
//                         session.message.text = content.trim();
//                     } else if (address.channelId === "telegram") {
//                         message.entities.filter((entity) => entity.mentioned && entity.mentioned.id === address.bot.id)
//                             .forEach((entity) => {
//                                 let mentionedText = content.substring(entity.offset, entity.length);
//                                 content = content.replace(mentionedText, "");
//                             });
//
//                         session.message.text = content.trim();
//                     }
//
//                     next();
//                 } else {
//                     console.log("Bot received a group message, but was not mentioned, cancelling dialog!");
//                     console.log(message);
//
//                     // TODO: maybe there's a possibility to ignore user message instead of cancelling the whole dialog
//                     session.cancelDialog();
//                 }
//             } else {
//                 next();
//             }
//         }
//     }
// };

module.exports = {
    bot,
    botBuilder,
    connector: connector
};
