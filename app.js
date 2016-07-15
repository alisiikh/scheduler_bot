'use strict';

const skype = require('skype-sdk');
const botService = require('./skype-bot-service');
const agenda = require('./agenda');
const SkypeAddress = require('./db').SkypeAddress;
const server = require('./server');
const commandParser = require('./command-parser');

botService.on('contactAdded', (bot, data) => {
    let skypeId = data.from;
    let displayName = data.fromDisplayName;

    SkypeAddress.findOne({ "skypeId": skypeId }, (err, skypeAddress) => {
        if (skypeAddress) {
            bot.reply(`Hello again, ${displayName}! Nice to see you back! :)`); 
            return;
        }

        new SkypeAddress({ 
            "skypeId": skypeId, 
            "displayName": displayName,
            "dateCreated": new Date()
        }).save();

        bot.reply(`Hello, ${displayName}! Say something to me, and I will let you know what I can.`, true);
    });
});

botService.on('contactRemoved', (bot, data) => {
    let skypeId = data.from;

    console.log(`contactRemoved event was triggered with data: ${JSON.stringify(data)}`);

    // agenda.schedule('now', 'removeContact', {
    //     "skypeId": skypeId
    // });
});

botService.on('personalMessage', (bot, data) => {
    let content = data.content;
    let skypeId = data.from;

    if (content.startsWith('Edited')) {
        console.log("User edited previous message, no need to spam!");
        return;
    }

    let command = commandParser.parseCommand(content);
    if (command == null) {
        let helpMessage = "Usage:\n\n";
        helpMessage += "schedule | in 1 minute | me | Retro was brilliant!\n";
        helpMessage += "schedule | in 30 seconds | all | Message can be multiline as well (wait)\n";
        helpMessage += "schedule | now | me | throw new UnsupportedOperationException( (facepalm) );\n";
        helpMessage += "schedule | in 10 days | me | or in ten days!\n";
        helpMessage += "repeat | 30 minutes | you can also repeat commands, but please use reasonable interval\n"
        helpMessage += "You can also type: 'abort' to me, and I will kill jobs that were triggered by you\n"
        helpMessage += "Or you can also unsubscribe if I pissed you off by typing 'unsubscribe' to me.\n\n"
        helpMessage += "If you have any questions or suggestions for improvements, please contact Aleksey! (punch)\nThanks, mate! :)";
        bot.reply(helpMessage, true);
        return;
    }

    if (command.name === 'schedule') {
        console.log(`Scheduling notification to be sent with content:\n\n${command.content}`);

        agenda.schedule(command.interval, 'sendNotifications', { 
            "content": command.content,
            "target": command.target,
            "skypeId": skypeId
        });

        if (command.interval !== 'now') {
            if (command.target === "me") {
                bot.reply("Scheduled new reminder job for you :)", true);
            } else if (command.target === "all") {
                bot.reply("Scheduled new reminder job for all (whew)", true);
            }
        }
    } else if (command.name === 'repeat') {
        console.log(`Scheduling repeat notification to be sent with content:\n\n${command.content}`);

        agenda.every(command.interval, 'repeatNotifications', { 
            "content": command.content,
            "skypeId": skypeId
        });

        bot.reply("Scheduled repeat job for you :)", true)
    } else if (command.name === 'abort') {
        agenda.schedule('now', 'abortNotifications', {
            "skypeId": skypeId
        });
    } else if (command.name === 'unsubscribe') {
        agenda.schedule('now', 'removeContact', {
            "skypeId": skypeId
        });
        agenda.schedule('now', 'abortNotifications', {
            "skypeId": skypeId
        });
    }
});

botService.on('message', (bot, data) => {
    console.log("message handler triggered");
    console.log(`message: ${JSON.stringify(data)}`);
});

botService.on('threadBotAdded', (bot, data) => {
    console.log("threadBotAdded handler triggered");
    console.log(`threadBotAdded: ${JSON.stringify(data)}`);
});

botService.on('threadBotRemoved', (bot, data) => {
    console.log("threadBotRemoved handler triggered");
    console.log(`threadBotRemoved: ${JSON.stringify(data)}`);
});

botService.on('threadAddMember', (bot, data) => {
    console.log("threadAddMember handler triggered");
    console.log(`threadAddMember: ${JSON.stringify(data)}`);
});

botService.on('threadRemoveMember', (bot, data) => {
    console.log("threadRemoveMember handler triggered");
    console.log(`threadRemoveMember: ${JSON.stringify(data)}`);
});

botService.on('threadTopicUpdated', (bot, data) => {
    console.log("threadTopicUpdated handler triggered");
    console.log(`threadTopicUpdated: ${JSON.stringify(data)}`);
});

botService.on('threadHistoryDisclosedUpdate', (bot, data) => {
    console.log("threadHistoryDisclosedUpdate handler triggered");
    console.log(`threadHistoryDisclosedUpdate: ${JSON.stringify(data)}`);
});

botService.on('attachment', (bot, data) => {
    console.log("attachment handler triggered");
    console.log(`attachment: ${JSON.stringify(data)}`);
});

