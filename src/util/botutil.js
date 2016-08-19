'use strict';

const Contact = require('./../model').Contact;

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

    static getAvailableCommands() {
        return {
            "Schedule one-time notification": "schedule",
            "Schedule repeatable notification": "repeat",
            "Abort of your running jobs": "abort",
            "Abort all of your running jobs": "abortall"
        };
    }
}

module.exports = BotUtil;