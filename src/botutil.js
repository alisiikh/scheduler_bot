const Contact = require('./model').Contact;

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
        if (message.user.name) {
            // possibly skype
            return message.user.name;
        } else if (message.address.channelId === 'telegram') {
            const firstName = message.sourceEvent.message.from.first_name;
            const lastName = message.sourceEvent.message.from.last_name;

            return `${firstName}${lastName ? ' ' + lastName : ''}`;
        } else {
            return '';
        }
    }
}

module.exports = BotUtil;