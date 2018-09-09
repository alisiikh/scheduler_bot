'use strict';

// process.env.TZ = 'Europe/Kyiv';

import server from './server';
import nunjucks from './nunjucks';
import hinterval from 'human-interval';
import cronParser from 'cron-parser';
import uuid from 'node-uuid';
import { bot as botConfig, server as serverConfig } from './config';

import { Contact } from './model';

import agenda from './agenda';
import { bot, botBuilder } from './bot';

import botUtil from './botutil';

const intents = new botBuilder.IntentDialog({ intentThreshold: 0.01 });

const agendaJobInfoTmpl = nunjucks.getTemplate('job-info.md');
const startCommandPromptTmpl = nunjucks.getTemplate('start-prompt.md');
const cancelCommandTmpl = nunjucks.getTemplate('cancel-command.md');
const scheduledTmpl = nunjucks.getTemplate('scheduled.md');
const abortConfirmationTmpl = nunjucks.getTemplate('abortall-confirmation.md');

server.listen(serverConfig.port, serverConfig.address, () => {
    console.log('%s is listening for incoming requests on port %s', server.name, server.url);
});

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
            .text(`Hello ${name || 'there'}... Thanks for having me.\nType in 'start' command to start`);
        bot.send(reply);
    } else {
        const userId = message.user.id;

        console.log("Removing user data for user { name: '" + message.user.name + "', id: '" + message.user.id + "' }");
        Contact.find({userId: userId}).remove().exec();
    }
});

bot.on('typing', (message) => {
    console.log("User { name: '" + message.user.name + "', id: '" + message.user.id + "' } is typing");
});

bot.on('deleteUserData', (message) => {
    const userId = message.user.id;

    console.log("Removing user data for user " + message.user.name + ", id: " + message.user.id);
    Contact.find({userId: userId}).remove().exec();
});

bot.use(botBuilder.Middleware.dialogVersion({
    version: botConfig.dialogVersion,
    resetCommand: /(\/)?reset$/i,
    message: 'I forgot all.'
}));

// bot.use(botBuilder.Middleware.processGroupMessages());
bot.use(botBuilder.Middleware.sendTyping());

bot.endConversationAction('cancel', cancelCommandTmpl.render(), { matches: /(\/)?cancel$/i });
// bot.beginDialogAction('help', '/help', { matches: /^help/i });

bot.dialog('/', intents);

intents.onDefault([
    (session) => {
        let message = session.message;
        let address = message.address;

        if (address.conversation.isGroup) {
            console.log(`Received the message in group: '${JSON.stringify(message, null, 3)}', doing nothing`);
            session.endDialog();
        } else {
            console.log(`Received the message: '${JSON.stringify(message, null, 3)}', sending a hint`);
            session.endDialog(`To start, please type in 'start' command.\nType 'cancel' anytime to discard conversation to start from scratch.`);
        }
    }
]);

intents.matches(/start$/i, [
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
                    const contact = botUtil.createContactFromMessage(message);
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
        const tmpl = startCommandPromptTmpl.render();
        const prompt = tmpl;
        const retryPrompt = `Sorry, I don't understand you, please try again!\n${tmpl}`;

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
            const command = botUtil.parseCommandName(args.response);
            session.userData.command = command;

            session.beginDialog(`/command/${command}`);
        }
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(
    botBuilder.PromptType.text, (response) => botUtil.isBotCommand(response)));

bot.dialog('/command/schedule', [
    (session) => {
        botBuilder.Prompts.text(session, `Type in some time interval,\ne.g. 5 minutes, 10 seconds, 8 hours, etc.`);
    },
    (session, args, next) => {
        if (args && args.response) {
            const interval = args.response.toLowerCase();
            if (isNaN(hinterval(interval))) {
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

            agenda.schedule(session.userData.interval, 'sendReminders', {
                jobId: uuid.v4(),
                address: session.message.address,
                content: session.userData.content,
                username: botUtil.getContactNameFromMessage(session.message)
            });

            session.endDialog(scheduledTmpl.render({interval: session.userData.interval}));
        } else {
            session.endDialog(cancelCommandTmpl.render());
        }
    }
]);

bot.dialog('/command/repeat', [
    (session) => {
        botBuilder.Prompts.text(session, `Type in some time interval,\ne.g. 5 minutes, 10 seconds, 8 hours, etc.`);
    },
    (session, args, next) => {
        if (args && args.response) {
            let intervalCorrect = !isNaN(hinterval(args.response));
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

            var repeatRemindersJob = agenda.create('repeatReminders', {
                jobId: uuid.v4(),
                address: session.message.address,
                content: session.userData.content,
                username: botUtil.getContactNameFromMessage(session.message)
            });
            repeatRemindersJob.repeatEvery(session.userData.interval).save();

            session.endDialog(scheduledTmpl.render({interval: session.userData.interval}));
        } else {
            session.endDialog(cancelCommandTmpl.render());
        }
    }
]);

bot.dialog('/command/firenow', [
    (session) => {
        const address = session.message.address;

        agenda.jobs({
            $or: [{name: 'sendReminders'}, {name: 'repeatReminders'}],
            'data.address.user.id': address.user.id,
            'data.address.conversation.id': address.conversation.id,
            'nextRunAt': {$ne: null}
        }, (err, jobs) => {
            if (err) {
                session.endDialog("Unexpected error, failed to run Reminders. Please try again.");
            } else {
                if (jobs.length > 0) {
                    const message = new botBuilder.Message()
                        .address(address)
                        .text(`Firing ${jobs.length} Reminders scheduled for current conversation`);
                    bot.send(message, (err) => {
                        if (!err) {
                            jobs.forEach((job) => {
                                agenda.now('sendReminders', job.attrs.data);
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

bot.dialog('/command/update', [
    (session, args, next) => {
        const address = session.message.address;

        agenda.jobs({
            'name': 'repeatReminders',
            'data.address.conversation.id': address.conversation.id,
            'data.address.user.id': address.user.id
        }, (err, jobs) => {
            if (err) {
                session.endDialog("Failed to query your running Reminders, please try next time.");
            } else {
                if (jobs.length > 0) {
                    let text = `Please send me back a number of the Reminder you want to update:\n`;
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

                        text += "\n";
                    });
                    session.dialogData.jobsIds = jobsIds;

                    botBuilder.Prompts.text(session, text);
                } else {
                    session.endDialog("You have no repeatable Reminders running in this conversation");
                }
            }
        })
    },
    (session, args, next) => {
        if (!args.response) {
            session.endDialog("You cancelled.");
        } else {
            const jobIndex = parseInt(args.response) - 1;
            const jobsIds = session.dialogData.jobsIds;

            if (isNaN(jobIndex) || jobIndex < 0 || jobIndex > jobsIds.length) {
                session.endDialog("Reminder index you provided is incorrect");
            } else {
                session.dialogData.jobIndex = jobIndex;

                botBuilder.Prompts.text(session, "Now please enter new content for this Reminder");
            }
        }
    },
    (session, args, next) => {
        if (!args.response) {
            session.endDialog("You cancelled.");
        } else {
            const jobsIds = session.dialogData.jobsIds;
            const jobIndex = session.dialogData.jobIndex;
            const content = args.response;

            agenda.jobs({
                'data.jobId': jobsIds[jobIndex]
            }, (err, jobs) => {
                if (err) {
                    session.endDialog("Failed to find a Reminder");
                } else {
                    jobs.forEach((job) => {
                        job.attrs.data.content = content;
                        job.save((err) => {
                            if (!err) {
                                session.endDialog("Reminder has been successfully updated");
                            } else {
                                session.endDialog("Failed to update Reminder, please try again later");
                            }
                        });
                    });
                }
            });
        }
    }
]);

bot.dialog('/command/abort', [
    (session, args, next) => {
        const address = session.message.address;
        agenda.jobs({
            $or: [{name: 'sendReminders'}, {name: 'repeatReminders'}],
            'data.address.user.id': address.user.id,
            'data.jobId': {$exists: true}
        }, (err, jobs) => {
            if (err) {
                session.endDialog("Failed to query your running Reminders, please try next time.");
            } else {
                if (jobs.length > 0) {
                    let text = `Please send me back a number (or comma separated numbers) of the Reminder(s) you want to stop:\n`;
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

                        text += "\n";
                    });
                    session.dialogData.jobsIds = jobsIds;

                    botBuilder.Prompts.text(session, text);
                } else {
                    const message = new botBuilder.Message()
                        .address(address)
                        .text("You have no running Reminders");
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
                    agenda.schedule('now', 'abortOneReminder', {
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
        botBuilder.Prompts.text(session, abortConfirmationTmpl.render());
    },
    (session, args) => {
        const decision = args.response;

        if (!decision || (decision !== 'yes' && decision !== 'no')) {
            session.endDialog(cancelCommandTmpl.render());
        } else if (decision === 'no') {
            session.endDialog("Ok, you've changed your mind (whew)");
        } else if (decision === 'yes') {
            agenda.schedule('now', 'abortReminders', {
                address: session.message.address,
            });
            session.endDialog();
        }
    }
]);