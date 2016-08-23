'use strict';

// load system first
require('./system');

const MD = require('./util/mdutil');
const nunjucks = require('./nunjucks');
const humanInterval = require('human-interval');
const cronParser = require('cron-parser');
const uuid = require('node-uuid');
const botCfg = require('./config').bot;

const Contact = require('./model').Contact;

const agenda = require('./agenda');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const intents = new botBuilder.IntentDialog({ intentThreshold: 0.01 });
const BotUtil = require('./util/botutil');

const agendaJobInfoTmpl = nunjucks.getTemplate('md/agenda_job_info.md');
const startCommandPromptTmpl = nunjucks.getTemplate('md/start_command_prompt.md');
const cancelCommandTmpl = nunjucks.getTemplate('md/cancel_command.md');

bot.on('conversationUpdate', (message) => {
    // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach((identity) => {
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
            message.membersRemoved.forEach((identity) => {
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

bot.on('contactRelationUpdate', (message) => {
    if (message.action === 'add') {
        const name = message.user ? message.user.name : null;
        const reply = new botBuilder.Message()
            .address(message.address)
            .text(`Hello ${name || 'there'}... Thanks for having me.${MD.nl()}Type in 'start' command to start`);
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', (message) => {
    // User is typing
});

bot.on('deleteUserData', (message) => {
    // User asked to delete their data
});

bot.use(botBuilder.Middleware.dialogVersion({
    version: botCfg.dialogVersion,
    resetCommand: /(\/)?reset$/i,
    message: 'Oops, I forgot everything. What were we talking about?'
}));

// TODO: remove this middleware if Skype guys change group messages format
bot.use(botBuilder.Middleware.convertSkypeGroupMessages());
bot.use(botBuilder.Middleware.sendTyping());

bot.endConversationAction('cancel', cancelCommandTmpl.render(), { matches: /(\/)?cancel$/i });
// bot.beginDialogAction('help', '/help', { matches: /^help/i });

bot.dialog('/', intents);

intents.onDefault([
    (session) => {
        let message = session.message;
        let address = message.address;

        if (address.channelId !== "skype" && address.conversation.isGroup) {
            console.log(`Received the message in group: '${JSON.stringify(message, null, 3)}', doing nothing`);
            session.endDialog();
        } else {
            console.log(`Received the message: '${JSON.stringify(message, null, 3)}', sending a hint`);
            session.endDialog(`To start, please type in 'start' command.${MD.nl()}Type 'cancel' anytime to discard conversation to start from scratch.`);
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
    (session) => {
        const tmpl = MD.convertPlainTextToMarkdown(startCommandPromptTmpl.render());
        const prompt = tmpl;
        const retryPrompt = `Sorry, I don't understand you, please try again!${MD.nl()}${tmpl}`;

        session.beginDialog('/command', {
            prompt: prompt,
            retryPrompt: retryPrompt,
            maxRetries: 3
        });
    },
    (session, args) => {
        if (!args.response) {
            session.endDialog(cancelCommandTmpl.render());
        } else {
            const command = BotUtil.parseCommandName(args.response);
            session.userData.command = command;

            session.beginDialog(`/command/${command}`);
        }
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(
    botBuilder.PromptType.text, (response) => BotUtil.isBotCommand(response)));

bot.dialog('/command/schedule', [
    (session) => {
        botBuilder.Prompts.text(session, `Type in some time interval,${MD.nl()}e.g. 5 minutes, 10 seconds, 8 hours, etc.`);
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
            session.endDialog(cancelCommandTmpl.render());
        }
    },
    (session) => {
        botBuilder.Prompts.text(session, 'Type in the content which you want to schedule');
    },
    (session, args) => {
        if (args && args.response) {
            session.userData.content = args.response;

            agenda.schedule(session.userData.interval, 'sendNotifications', {
                jobId: uuid.v4(),
                address: session.message.address,
                content: session.userData.content,
                username: BotUtil.getContactNameFromMessage(session.message)
            });

            session.endDialog(`Notification has been scheduled, I will send you back in '${session.userData.interval}'`);
        } else {
            session.endDialog(cancelCommandTmpl.render());
        }
    }
]);

bot.dialog('/command/repeat', [
    (session) => {
        botBuilder.Prompts.text(session, `Type in some time interval,${MD.nl()}e.g. 5 minutes, 10 seconds, 8 hours, etc.`);
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
            session.endDialog(cancelCommandTmpl.render());
        }
    },
    (session) => {
        botBuilder.Prompts.text(session, 'Type in the content which you want to repeat');
    },
    (session, args) => {
        if (args && args.response) {
            session.userData.content = args.response;

            var repeatNotificationsJob = agenda.create('repeatNotifications', {
                jobId: uuid.v4(),
                address: session.message.address,
                content: session.userData.content,
                username: BotUtil.getContactNameFromMessage(session.message)
            });
            repeatNotificationsJob.repeatEvery(session.userData.interval).save();

            session.endDialog(`Notification has been scheduled for repeating, I will send you back every '${session.userData.interval}'`);
        } else {
            session.endDialog(cancelCommandTmpl.render());
        }
    }
]);

bot.dialog('/command/firenow', [
    (session) => {
        const address = session.message.address;

        agenda.jobs({
            $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}],
            'data.address.user.id': address.user.id,
            'data.address.conversation.id': address.conversation.id,
            'nextRunAt': {$ne: null}
        }, (err, jobs) => {
            if (err) {
                session.endDialog("Unexpected error, failed to run jobs. Please try again.");
            } else {
                if (jobs.length > 0) {
                    const message = new botBuilder.Message()
                        .address(address)
                        .text(`Firing ${jobs.length} jobs scheduled for current conversation`);
                    bot.send(message, (err) => {
                        if (!err) {
                            jobs.forEach((job) => {
                                agenda.now('sendNotifications', job.attrs.data);
                            });
                        }
                    });

                    session.endDialog();
                } else {
                    session.endDialog("You have no active jobs running in this chat");
                }
            }
        });

    }
]);

bot.dialog('/command/abort', [
    (session, args, next) => {
        const address = session.message.address;
        agenda.jobs({
            $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}],
            'data.address.user.id': address.user.id,
            'data.jobId': {$exists: true}
        }, (err, jobs) => {
            if (err) {
                session.endDialog("Failed to query your running jobs, please try next time.");
            } else {
                if (jobs.length > 0) {
                    let text = `Please send me back a number (or comma separated numbers) of the job(s) you want to stop:${MD.nl()}`;
                    const jobsIds = [];

                    jobs.forEach((job, idx) => {
                        const content = job.attrs.data.content;
                        const jobId = job.attrs.data.jobId;

                        jobsIds.push(jobId);

                        text += agendaJobInfoTmpl.render({
                            idx: ++idx,
                            jobName: job.attrs.name,
                            lastRunAt: job.attrs.lastRunAt,
                            nextRunAt: job.attrs.nextRunAt,
                            content: content
                        });

                        text += MD.nl();
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
    (session, args) => {
        if (!args.response) {
            session.endDialog(cancelCommandTmpl.render());
        } else {
            const jobsIds = session.dialogData.jobsIds;
            const jobsIndexes = args.response.split(",")
                .map((jobIndex) => parseInt(jobIndex) - 1);


            var hasErrors = false;
            jobsIndexes.forEach((jobIndex) => {
                if (isNaN(jobIndex) || jobIndex < 0 || jobIndex > jobsIds.length) {
                    hasErrors = true;
                } else {
                    agenda.schedule('now', 'abortOneNotification', {
                        address: session.message.address,
                        jobId: jobsIds[jobIndex]
                    });
                }
            });

            if (hasErrors) {
                session.endDialog("Finished abort command with errors");
            } else {
                session.endDialog();
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