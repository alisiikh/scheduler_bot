'use strict';

import * as botBuilder from 'botbuilder';
import {bot as botConfig} from './config';
import {UserData, ConversationData} from './model';

const connector = new botBuilder.ChatConnector({
    appId: botConfig.botAppId,
    appPassword: botConfig.botAppSecret
});

const bot = new botBuilder.UniversalBot(connector);

class BotDataStorage {
    constructor() {
        // TODO: cache to these for faster access
        this.userDataCache = {};
        this.convDataCache = {};
    }

    getData(context, callback) {
        const data = {};

        let userDataPromise = null;
        let convDataPromise = null;
        let privConvDataPromise = null;

        if (context.userId) {
            console.log("User data");
            if (context.persistUserData) {
                userDataPromise = UserData.findOne({userId: context.userId}).exec();
            } else {
                userDataPromise = Promise.resolve(null);
            }

            console.log("Private conversation data");
            if (context.conversationId) {
                const key = context.userId + ':' + context.conversationId;
                privConvDataPromise = ConversationData.findOne({convId: key}).exec();
            } else {
                privConvDataPromise = Promise.resolve(null);
            }
        }

        console.log("Conversation data");
        if (context.persistConversationData && context.conversationId) {
            convDataPromise = ConversationData.findOne({convId: context.conversationId}).exec();
        } else {
            convDataPromise = Promise.resolve(null);
        }

        Promise.all([userDataPromise, privConvDataPromise, convDataPromise]).then((values) => {
            data.userData = values[0];
            data.privConvData = values[1];
            data.convData = values[2];

            console.log(values);

            callback(null, data);
        });
    }

    deleteData(context) {
        if (context.userId) {
            if (context.conversationId) {
                ConversationData.findOneAndDelete({convId: context.conversationId}, this.logOnError);
            } else {
                UserData.findOneAndDelete({userId: context.userId}).exec();

                ConversationData.deleteMany({convId: new RegExp("^" + context.userId)}, this.logOnError);
            }
        }
    }

    saveData(context, data, callback) {
        if (context.userId) {
            if (context.persistUserData && data.userData) {
                // save contact
                console.log(`Saving user data for user id: ${context.userId}`);

                UserData.findOne({userId: context.userId}, (err, userData) => {
                    this.logOnError(err);

                    if (!userData) {
                        let stored = data.userData;
                        stored.userId = context.userId;

                        console.log(`No user data found for user id: ${context.userId}, storing new.`);
                        new UserData(data.userData).save(this.logOnError);
                    } else {
                        UserData.findOneAndUpdate({userId: context.userId}, data.userData, this.logOnError);
                    }
                });
            }
            if (context.conversationId) {
                console.log(`Saving private conversation data for user id: ${context.userId}`);
                this.storeConvData(context.userId + ':' + context.conversationId, data.privateConversationData);
            }
        }
        if (context.persistConversationData && context.conversationId) {
            console.log(`Saving conversation data for user id: ${context.userId}`);
            this.storeConvData(context.conversationId, data.conversationData);
        }

        callback(null);
    }

    storeConvData(key, data) {
        ConversationData.findOne({convId: key}, (err, convData) => {
            if (!convData) {
                const stored = data;
                stored.convId = key;

                new ConversationData(stored).save(this.logOnError);
            } else {
                ConversationData.findOneAndUpdate({convId: key}, data, this.logOnError);
            }
        });
    }

    logOnError(err) {
        if (err) {
            console.error(err);
        }
    }
}

bot.set('storage', new BotDataStorage());

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
    connector
};
