'use strict';

// TODO: Enable scheduling by exact date+time
// TODO: Fix working of bot in group

const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const humanInterval = require('human-interval');
const cronParser = require('cron-parser');
const Contact = require('./model').Contact;
const intents = new botBuilder.IntentDialog();
const uuid = require('node-uuid');
const BotUtil = require('./botutil');
const swig = require('./swig');

const jobAbortInfoTmpl = swig.compileFile('template/md/job_abort_info.md');
const startPromptTmpl = swig.compileFile('template/md/start_prompt.md');

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

bot.use(botBuilder.Middleware.dialogVersion({
    version: 1.0,
    resetCommand: /(\/)?reset$/i,
    message: 'Conversation data has been cleared'
}));

bot.dialog('/', intents);

intents.onDefault([
    (session, args, next) => {
        if (session.message.address.conversation.isGroup) {
            console.log(`Received the message in group: '${JSON.stringify(session.message, null, 3)}', doing nothing`);
            session.endDialog();
        } else {
            console.log(`Received the message: '${JSON.stringify(session.message, null, 3)}', sending a hint`);
            session.endDialog("To start, please type in 'start' command. \n\nUse 'cancel' to reset dialog.");
        }
    }
]);

intents.matches(/(\/)?start$/i, [
    (session, args, next) => {
        if (session.userData.contact) {
            next();
            return;
        }

        const message = session.message;
        const userId = message.user.id;

        Contact.findOne({userId: userId})
            .exec((err, contact) => {
                if (!contact) {
                    const contact = BotUtil.createContactFromMessage(message);
                    contact.save()
                        .then((contact) => {
                            session.userData.contact = contact;
                            next();
                        });
                } else {
                    session.userData.contact = contact;
                    next();
                }
            });
    },
    (session, args) => {
        const prompt = startPromptTmpl();
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
            const command = BotUtil.parseCommandName(args.response);
            session.userData.command = command;

            session.beginDialog(`/command/${command}`);
        }
    }
]);

intents.matches(/kapusta/gi, [
    (session, args, next) => {
        session.endDialog(`Who said 'kapusta'? How dare you, mr. ${session.userData.contact.name}?!`);
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(
    botBuilder.PromptType.text, (response) => BotUtil.isBotCommand(response)));

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
                    let text = 'Please send me back an id of a job you want to cancel:\n\n';
                    const jobsIds = [];

                    jobs.forEach((job, idx) => {
                        const content = job.attrs.data.content;
                        const jobId = job.attrs.data.jobId;

                        jobsIds.push(jobId);

                        text += jobAbortInfoTmpl({
                            idx: ++idx,
                            jobId: jobId,
                            jobName: job.attrs.name,
                            lastRunAt: job.attrs.lastRunAt,
                            nextRunAt: job.attrs.nextRunAt,
                            content: content
                        });

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