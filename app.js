'use strict';

const skype = require('skype-sdk');
const botService = require('./skype-bot-service');
const agenda = require('./agenda');
const SkypeAddress = require('./db').SkypeAddress;
const server = require('./server');

botService.on('contactAdded', (bot, data) => {
    console.log("Contact added data: " + JSON.stringify(data));

    var skypeId = data.from;
    var displayName = data.fromDisplayName;

    SkypeAddress.find({ "skypeId": skypeId }, (err, skypeAddresses) => {
        if (err) {
            console.error("Failed to find skype contacts.", err);
            return;
        }

        if (skypeAddresses.length != 0) {
            bot.reply("Hello again, " + displayName + "! Nice to see you back! :)"); 
            return;
        }

        var skypeAddress = new SkypeAddress({ 
            "skypeId": skypeId, 
            "displayName": displayName,
            "dateCreated": new Date()
        });

        skypeAddress.save(function(err) {
            if (!err) {
                console.log("Stored new skype contact with a name: " + skypeId);
            } else {
                console.error("Failed to store skype contact " + skypeId);
            }
        });

        bot.reply("Hello, FlowFacter! \nI'm your reminder sender to any contact I'm added to! \n\n" 
            + "For any suggestions please contact 8:lizard5472 :)", true);
    });
});

botService.on('contactRemoved', (bot, data) => {
    console.log(`contactRemoved: ${JSON.stringify(data)}`);
});

botService.on('personalMessage', (bot, data) => {
    var command = data.content;
    if (command.startsWith('Edited')) {
        console.log("User edited previous message, no need to spam!");
        return;
    }

    function onError() {
        var replyErrorMessage = "Command is incorrect, please see examples below:\n\n";
        replyErrorMessage += "Example Usages:\n\n";
        replyErrorMessage += "schedule | in 1 minute | Retro was brilliant!\n";
        replyErrorMessage += "schedule | in 30 seconds | Message can be multiline as well (wait)\n";
        replyErrorMessage += "schedule | now | throw new UnsupportedOperationException( (facepalm) );\n";
        replyErrorMessage += "schedule | in 10 days | or in ten days!\n";
        replyErrorMessage += "\nIf you have any questions on time parameter, please ask Aleksey! (punch)";
        bot.reply(replyErrorMessage, true);
    }

    try {
        var parsedCommand = command.split('|', 3);
        if (parsedCommand.length != 3) {
            throw new Error("Incorrect command: " + parsedCommand);
            return;
        }

        var commandName = parsedCommand[0].trim();
        var reminderInterval = parsedCommand[1].trim();
        var content = parsedCommand[2].trim();

        if (commandName != 'schedule') {
            throw new Error("Incorrect command name, was: " + commandName);
            return;
        }
    } catch (e) {
        console.error("Failed to parse bot command", e);
        onError();
        return;
    }

    console.log("Scheduling notification to be sent with content:\n\n" + content);
    try {
        agenda.schedule(reminderInterval, 'sendNotifications', { "content": content });
    } catch (e) {
        console.error("Failed to schedule notification", e);
        bot.reply("Error occurred during scheduling reminder", true);
        return;
    }
    
    var replyMessage = "Scheduled new reminder job (whew)";
    bot.reply(replyMessage, true);
});

botService.on('message', (bot, data) => {
    console.log(`message: ${JSON.stringify(data)}`);
});

botService.on('threadBotAdded', (bot, data) => {
    console.log(`threadBotAdded: ${JSON.stringify(data)}`);
});

botService.on('threadBotRemoved', (bot, data) => {
    console.log(`threadBotRemoved: ${JSON.stringify(data)}`);
});

botService.on('threadAddMember', (bot, data) => {
    console.log(`threadAddMember: ${JSON.stringify(data)}`);
});

botService.on('threadRemoveMember', (bot, data) => {
    console.log(`threadRemoveMember: ${JSON.stringify(data)}`);
});

botService.on('threadTopicUpdated', (bot, data) => {
    console.log(`threadTopicUpdated: ${JSON.stringify(data)}`);
});

botService.on('threadHistoryDisclosedUpdate', (bot, data) => {
    console.log(`threadHistoryDisclosedUpdate: ${JSON.stringify(data)}`);
});

botService.on('attachment', (bot, data) => {
    console.log(`threadHistoryDisclosedUpdate: ${JSON.stringify(data)}`);
});

