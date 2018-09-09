// const Contact = require('./model').Contact;

class BotUtil {

    static get CommandRegex() {
        return /[\/]?(schedule|repeat|abort|abortall|firenow|update)$/i;
    }

    // static createContactFromMessage(message) {
    //     const user = message.user;
    //     const userId = user.id;
    //     const name = BotUtil.getContactNameFromMessage(message);
    //     const channelId = message.address.channelId;
    //
    //     return new Contact({
    //         userId: userId,
    //         name: name,
    //         channel: channelId,
    //         dateCreated: new Date(),
    //     });
    // }

    static getContactNameFromMessage(message) {
        if (message.user.hasOwnProperty('name')) {
            return message.user.name;
        } else if (message.address.channelId === 'telegram') {
            const firstName = message.sourceEvent.message.from.first_name || '';
            const lastName = message.sourceEvent.message.from.last_name || '';

            return `${firstName}${lastName ? ' ' + lastName : ''}`.trim();
        } else {
            return '';
        }
    }

    static parseCommand(response) {
        if (BotUtil.isCommand(response)) {
            const matcher = BotUtil.CommandRegex.exec(response);
            if (matcher.length > 0) {
                return matcher[1];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    static isCommand(response) {
        return BotUtil.CommandRegex.test(response);
    }

    // static isBotMentioned(message) {
    //     if (message.entities.length > 0) {
    //         return message.entities
    //                 .filter((entity) => entity.mentioned && entity.mentioned.id === message.address.bot.id).length > 0;
    //     }
    //
    //     return false;
    // }
}

module.exports = BotUtil;