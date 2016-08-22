const Contact = require('./../model').Contact;

const COMMAND_NAME_REGEX = /[\/]?(schedule|repeat|abort|abortall|firenow)$/i;

class BotUtil {

    static createContactFromMessage(message) {
        const user = message.user;
        const userId = user.id;
        const name = BotUtil.getContactNameFromMessage(message);
        const channelId = message.address.channelId;

        return new Contact({
            userId: userId,
            name: name,
            channel: channelId,
            dateCreated: new Date(),
        });
    }

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

    static parseCommandName(response) {
        if (BotUtil.isBotCommand(response)) {
            const match = COMMAND_NAME_REGEX.exec(response);
            if (match.length > 0) {
                return match[1];
            }
        } else {
            return null;
        }
    }

    static isBotCommand(response) {
        return COMMAND_NAME_REGEX.test(response);
    }
}

module.exports = BotUtil;