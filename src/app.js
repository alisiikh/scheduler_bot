'use strict';

const async = require('async');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const humanInterval = require('human-interval');
const cronParser = require('cron-parser');
const Contact = require('./model').Contact;
const intents = new botBuilder.IntentDialog();

bot.on('conversationUpdate', function (message) {
    // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                const reply = new botBuilder.Message()
                    .address(message.address);
                if (identity.id === message.address.bot.id) {
                    reply.text("Hello everyone!");
                    bot.send(reply);
                } else {
                    reply.text(`Welcome, ${identity.name}`);
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                const reply = new botBuilder.Message()
                    .address(message.address);
                if (identity.id === message.address.bot.id) {
                    reply.text("Goodbye");
                    bot.send(reply);
                } else {
                    reply.text(`Farewell, ${identity.name}`);
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
            .text("Hello %s... Thanks for having me. \n\nType in 'start' command to start", name || 'there');
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

bot.on('groupMessage', function(message) {
   console.log(message);
});

bot.dialog('/', intents);

intents.onDefault([
    (session, args, next) => {
        if (session.message.address.conversation.isGroup) {
            console.log(`Received the message in group: '${session.message.text}', doing nothing`);
        } else {
            console.log(`Received the message: '${session.message.text}', sending a hint`);
            session.send("To start, please type in 'start' command. \n\nUse 'cancel' to reset dialog.");
        }
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
                        channel: message.address.channelId,
                        dateCreated: new Date(),
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
        const prompt = `Choose a command from:\n
'schedule' - schedule a delayed one-time notification\n
'repeat' - schedule a repeatable notification\n
'abort' - abort all running scheduled jobs`;
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
            const command = args.response.toLowerCase();
            session.userData.command = command;

            session.beginDialog(`/command/${command}`);
        }
    }
]);

intents.matches(/kapusta/gi, [
    (session, args, next) => {
        session.send(`Who said 'kapusta'? How dare you, mr. ${session.message.user.name}?!`);
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(
    botBuilder.PromptType.text, (response) => /^(schedule|repeat|abort)$/i.test(response)));

bot.dialog('/command/schedule', [
    (session) => {
        botBuilder.Prompts.text(session, 'Type in some time interval, \n\ne.g. 5 minutes, 10 seconds, 8 hours, etc.');
    },
    (session, args, next) => {
        if (args && args.response) {
            const interval = args.response.toLowerCase();
            if (isNaN(humanInterval(interval))) {
                session.endDialog("You've entered an incorrect interval");
            } else {
                session.userData.interval = interval;

                next();
            }
        } else {
            session.endDialog("You cancelled.");
        }
    },
    (session, args, next) => {
        botBuilder.Prompts.text(session, 'Type in the content which you want to schedule');
    },
    (session, args, next) => {
        if (args && args.response) {
            session.userData.content = args.response;

            agenda.schedule(session.userData.interval, 'sendNotifications', {
                address: session.message.address,
                content: session.userData.content,
            });

            session.endDialog(`Notification has been scheduled, I will send you back in '${session.userData.interval}'`);
        } else {
            session.endDialog("You cancelled.");
        }
    }
]);

bot.dialog('/command/repeat', [
    (session) => {
        botBuilder.Prompts.text(session, 'Type in some time interval, \n\ne.g. 5 minutes, 10 seconds, 8 hours, etc.');
    },
    (session, args, next) => {
        if (args && args.response) {
            let intervalCorrect = !isNaN(humanInterval(args.response));
            if (!intervalCorrect) {
                try {
                    cronParser.parseExpression(args.response);
                    intervalCorrect = true;
                } catch (e) {
                    console.log(`User typed in incorrect interval which is not cron expression as well: ${args.response}`);
                }
            }

            if (!intervalCorrect) {
                session.endDialog("Incorrect interval. Operation cancelled.");
            } else {
                session.userData.interval = args.response;

                next();
            }
        } else {
            session.endDialog("You cancelled.");
        }
    },
    (session, args, next) => {
        botBuilder.Prompts.text(session, 'Type in the content which you want to repeat');
    },
    (session, args, next) => {
        if (args && args.response) {
            session.userData.content = args.response;

            agenda.every(session.userData.interval, 'repeatNotifications', {
                address: session.message.address,
                content: session.userData.content,
            });

            session.endDialog(`Notification has been scheduled for repeating, I will send you back every '${session.userData.interval}'`);
        } else {
            session.endDialog("You cancelled.");
        }
    }
]);

bot.dialog('/command/abort', [
    (session) => {
        agenda.schedule('now', 'abortNotifications', {
            address: session.message.address,
        });
        session.endDialog();
    }
]);
