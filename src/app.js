'use strict';

const async = require('async');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const humanInterval = require('human-interval');
const cronParser = require('cron-parser');
const Contact = require('./model').Contact;
const intents = new botBuilder.IntentDialog();
const uuid = require('node-uuid');
const BotUtil = require('./botutil');

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
        const name = message.user ? message.user.name : null;
        const reply = new botBuilder.Message()
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

bot.on('groupMessage', function (message) {
    console.log("Group message: " + message);
});

bot.dialog('/', intents);

intents.onDefault([
    (session, args, next) => {
        if (session.message.address.conversation.isGroup) {
            console.log(`Received the message in group: '${session.message.text}', doing nothing`);
            console.log(`Address from group: ${session.message.address}`);
            console.log(`Message: ${JSON.stringify(session.message)}`);
        } else {
            console.log(`Received the message: '${session.message.text}', sending a hint`);
            session.send("To start, please type in 'start' command. \n\nUse 'cancel' to reset dialog.");
        }
    }
]);

intents.matches(/^start$/i, [
    (session, args, next) => {
        if (session.userData.contact) {
            const contact = session.userData.contact;

            console.log(JSON.stringify(contact));
            if (contact.name === "undefined") {
                console.log("Yep");
                contact.name = BotUtil.getContactNameFromMessage(session.message);
                console.log(JSON.stringify(contact));
                contact.save()
                    .then((contact) => {
                        session.userData.contact = contact;
                    });

                console.log("Really?!");
            }
            next();
            return;
        }

        const message = session.message;
        const userId = message.user.id;

        Contact.findOne({userId: userId})
            .exec((err, contact) => {
                if (!contact) {
                    const contact = BotUtil.createContactFromMessage(message);
                    contact.save();
                } else {
                    if (!contact.name) {
                        contact.name = BotUtil.getContactNameFromMessage(message);
                        contact.save();
                    }
                }
            })
            .then((contact) => {
                session.userData.contact = contact;
                next();
            });
    },
    (session, args) => {
        const prompt = `Choose a command from:\n
'schedule' - schedule a delayed one-time notification\n
'repeat' - schedule a repeatable notification\n
'abort' - abort a single running job\n
'abortall' - abort all of your currently running jobs`;
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
    botBuilder.PromptType.text, (response) => /^(schedule|repeat|abort|abortall)$/i.test(response)));

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
                jobId: uuid.v4()
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
                jobId: uuid.v4()
            });

            session.endDialog(`Notification has been scheduled for repeating, I will send you back every '${session.userData.interval}'`);
        } else {
            session.endDialog("You cancelled.");
        }
    }
]);

bot.dialog('/command/abort', [
    (session, args, next) => {
        const address = session.message.address;
        agenda.jobs({
            $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}],
            'data.address.user.id': address.user.id,
            'data.jobId': {$exists: true}
        }, function (err, /* Array */ jobs) {
            if (err) {
                session.endDialog("Failed to query your running jobs, please try next time.");
            } else {
                if (jobs.length > 0) {
                    let text = 'Please send me back an id of a job you want to cancel\n\n';
                    const jobsIds = [];
                    const dateOptions = {
                        hour: 'numeric',
                        minute: 'numeric',
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                    };

                    jobs.forEach((job, idx) => {
                        const content = job.attrs.data.content;
                        const jobId = job.attrs.data.jobId;

                        jobsIds.push(jobId);

                        text +=
                            `${++idx}. id: ${jobId},\n
name: ${job.attrs.name},\n
lastRunAt: ${job.attrs.lastRunAt != null ? job.attrs.lastRunAt.toLocaleString('en-US', dateOptions) : 'no'},\n
nextRunAt: ${job.attrs.nextRunAt != null ? job.attrs.nextRunAt.toLocaleString('en-US', dateOptions) : 'no'},\n
content: ${content.substring(0, 15 > content.length ? content.length : 15)}...\n`;

                    });
                    session.dialogData.jobsIds = jobsIds;

                    botBuilder.Prompts.text(session, text);
                } else {
                    const message = new botBuilder.Message()
                        .address(address)
                        .text("You have no running jobs");
                    bot.send(message);

                    session.endDialog();
                }
            }
        });
    },
    (session, args, next) => {
        if (!args.response) {
            session.endDialog("You cancelled.");
        } else {
            const jobId = args.response;
            if (session.dialogData.jobsIds.indexOf(jobId) !== -1) {
                agenda.schedule('now', 'abortOneNotification', {
                    address: session.message.address,
                    jobId: args.response
                });

                session.endDialog();
            } else {
                session.endDialog("Incorrect job id, cancelling action.");
            }
        }
    }
]);

bot.dialog('/command/abortall', [
    (session) => {
        agenda.schedule('now', 'abortNotifications', {
            address: session.message.address,
        });
        session.endDialog();
    }
]);


var json = {
    "type": "message",
    "timestamp": "2016-07-21T19:29:09.0367374+00:00",
    "text": "nykak cho",
    "attachments": [],
    "entities": [],
    "address": {
        "id": "DFFlUCWEZAQ", "channelId": "telegram", "user": {
            "id": "3942079"
        }
        ,
        "conversation": {
            "isGroup": true, "id": "-20027856", "name": "������������ is not a teenager anymore"
        }
        ,
        "bot": {
            "id": "smart_scheduler_bot", "name": "schedulerbot"
        }
        ,
        "serviceUrl": "https://telegram.botframework.com", "useAuth": true
    },
    "source": "telegram",
    "sourceEvent": {
        "update_id": 467125622,
        "message": {
            "message_id": 472,
            "from": {
                "id": 3942079, "first_name": "Aleksey", "last_name": "Lisiikh"
            }
            ,
            "date": 1469129349, "chat": {
                "id": -20027856, "type": "group", "title": "������������ is not a teenager anymore"
            }
            ,
            "forward_date": -62135596800, "text": "nykak cho"
        }
    }
    ,
    "agent": "botbuilder",
    "user": {
        "id": "3942079"
    }
};