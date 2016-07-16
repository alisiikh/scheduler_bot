'use strict';

const async = require('async');
const server = require('./server');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const Contact = require('./model').Contact;
const botCfg = require('./config').bot;
const intents = new botBuilder.IntentDialog();
const botCommands = ["schedule", "repeat", "cancel"];


bot.on('conversationUpdate', function (message) {
    // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new botBuilder.Message()
                        .address(message.address)
                        .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new botBuilder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new botBuilder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for having me. Say 'start' to start scheduling.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', function (message) {
    // User is typing
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

bot.dialog('/', intents);

intents.onDefault([
    (session, args, next) => {
        console.log("Ok, default action, I do nothing.");
    }
]);

intents.matches(/^start$/i, [
    (session, args, next) => {
        const message = session.message;
        const user = message.user;

        const onContactSync = (contact) => {
            session.userData.contact = contact;
            next();
        };

        if (!session.userData.contact) {
            Contact.findOne({userId: user.id}, (err, contact) => {
                if (!contact) {
                    const contact = new Contact({
                        userId: user.id,
                        name: user.name,
                        dateCreated: new Date()
                    });
                    contact.save().then((contact) => {
                        onContactSync(contact);
                    });
                } else {
                    onContactSync(contact);
                }
            });
        } else {
            next();
        }
    },
    (session, args) => {
        const prompt = `Choose a command from: \n\n[${botCommands.join(', ')}]`;
        session.beginDialog('/command', {
            prompt: prompt,
            retryPrompt: `Sorry, I don't understand you, please try again!\n\n${prompt}`,
            maxRetries: 3
        });
    },
    (session, args) => {
        if (!args.response) {
            session.endDialog("You cancelled.");
        } else {
            session.dialogData.command = args.response;

            session.beginDialog(`/command/${session.dialogData.command}`);
        }
    }
]);

intents.matches(/^stop$/i, [
    (session, args, next) => {
        session.send("Ahah, stop?! Are you serious?! :D");
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(
    botBuilder.PromptType.text, (response) => /^(schedule|repeat)$/i.test(response)));

bot.dialog('/command/schedule', [
    (session) => {
        session.send("So you chose schedule command, nice!");
        session.endDialog();
    }
]);

bot.dialog('/command/repeat', [
    (session) => {
        session.send("So you chose repeat command, nice!");
        session.endDialog();
    }
]);