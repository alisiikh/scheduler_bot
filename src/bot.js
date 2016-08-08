'use strict';

const botCfg = require('./config').bot;
const botBuilder = require('botbuilder');

const botConnector = new botBuilder.ChatConnector({
    appId: botCfg.botAppId,
    appPassword: botCfg.botAppSecret
});

const bot = new botBuilder.UniversalBot(botConnector);

class BotMiddleware {
    static fixSkypeGroupMessaging() {
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

                        console.log("Converted group message: " + content);
                    }
                }

                next();
            }
        }
    }
}

module.exports = {
    bot,
    botBuilder,
    botConnector,
    BotMiddleware
};


/**
 * {
   "type": "message",
   "timestamp": "2016-08-08T17:43:39.435Z",
   "text": "<at id=\"28:74e0ce5a-1742-4540-9abe-ce07ca95a07c\">@SchedulerBot</at> opachki",
   "entities": [
      {
         "mentioned": {
            "id": "28:74e0ce5a-1742-4540-9abe-ce07ca95a07c"
         },
         "text": "<at id=\"28:74e0ce5a-1742-4540-9abe-ce07ca95a07c\">@SchedulerBot</at>",
         "type": "mention"
      }
   ],
   "attachments": [],
   "address": {
      "id": "1470678219439",
      "channelId": "skype",
      "user": {
         "id": "29:1hyw85l_likmaQZzvY73UbXOsZ4V_AtWM2RC03sUNVN4",
         "name": "Aleksey Lisiikh"
      },
      "conversation": {
         "isGroup": true,
         "id": "19:456b0383e6cd431b896def914305d55d@thread.skype"
      },
      "bot": {
         "id": "28:74e0ce5a-1742-4540-9abe-ce07ca95a07c",
         "name": "SchedulerBot"
      },
      "serviceUrl": "https://skype.botframework.com",
      "useAuth": true
   },
   "source": "skype",
   "agent": "botbuilder",
   "user": {
      "id": "29:1hyw85l_likmaQZzvY73UbXOsZ4V_AtWM2RC03sUNVN4",
      "name": "Aleksey Lisiikh"
   }
}
 */