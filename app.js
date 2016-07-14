'use strict';

const skype = require('skype-sdk');
const botService = require('./skype-bot-service');
const agenda = require('./agenda');
const SkypeAddress = require('./db').SkypeAddress;
const server = require('./server');
const skypeCommandParser = require('./skype-command-parser');

botService.on('contactAdded', (bot, data) => {
    console.log(`Contact added data: ${JSON.stringify(data)}`);

    let skypeId = data.from;
    let displayName = data.fromDisplayName;

    SkypeAddress.find({ "skypeId": skypeId }, (err, skypeAddresses) => {
        if (skypeAddresses.length != 0) {
            bot.reply(`Hello again, ${displayName}! Nice to see you back! :)`); 
            return;
        }

        let skypeAddress = new SkypeAddress({ 
            "skypeId": skypeId, 
            "displayName": displayName,
            "dateCreated": new Date()
        });

        skypeAddress.save(function(err) {
            if (!err) {
                console.log(`Stored new skype contact with a name: ${skypeId}`);
            } else {
                console.error(`Failed to store skype contact ${skypeId}`);
            }
        });

        bot.reply(`Hello, ${displayName}! Say something to me, and I will let you know what I can.`, true);
    });
});

botService.on('contactRemoved', (bot, data) => {
    let skypeId = data.from;

    agenda.schedule('now', 'removeContact', {
        "skypeId": skypeId
    });
});

botService.on('personalMessage', (bot, data) => {
    let content = data.content;
    let skypeId = data.from;

    if (content.startsWith('Edited')) {
        console.log("User edited previous message, no need to spam!");
        return;
    }

    try {
        let command = skypeCommandParser.parseCommand(content);
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

            agenda.every(command.interval, 'sendNotifications', { 
                "content": command.content,
                "target": "me",
                "skypeId": skypeId
            });
        } else if (command.name === 'abort') {
            agenda.schedule('now', 'abortNotifications', {
                "skypeId": skypeId
            });

            // TODO: Change a message in return
            botService.send(skypeId, "Sadly, I can't perform this action yet, \nAleksey is very tired after work and has no time to play with me :(");
        } else if (command.name === 'unsubscribe') {
            agenda.schedule('now', 'removeContact', {
                "skypeId": skypeId
            });

            bot.reply("It's sad to see you go, hope you will return someday ;(", true);
        }
    } catch (e) {
        console.log("Failed to parse command", e);

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

