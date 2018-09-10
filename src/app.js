'use strict';

// process.env.TZ = 'Europe/Kyiv';

import server from './server';
import templateEngine from './nunjucks';
import hinterval from 'human-interval';
import cron from 'cron-parser';
import uuid from 'node-uuid';
import { bot as botConfig, server as serverConfig } from './config';

import agenda from './agenda';
import { bot, botBuilder } from './bot';

import botUtil from './botutil';

const jobInfoTmpl = templateEngine.getTemplate('job-info.md');
const starterTmpl = templateEngine.getTemplate('start-prompt.md');
const canceledTmpl = templateEngine.getTemplate('cancel-command.md');
const scheduledTmpl = templateEngine.getTemplate('scheduled.md');
const abortAllTmpl = templateEngine.getTemplate('abortall-confirmation.md');

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

// bot.on('contactRelationUpdate', (message) => {
//     if (message.action === 'add') {
//         const name = message.user ? message.user.name : null;
//         const reply = new botBuilder.Message()
//             .address(message.address)
//             .text(`Hello ${name || 'there'}... Thanks for having me.\nType in 'start' command to start`);
//         bot.send(reply);
//     } else {
//         const userId = message.user.id;
//
//         console.log("Removing user data for user { name: '" + message.user.name + "', id: '" + message.user.id + "' }");
//         Contact.find({userId: userId}).remove().exec();
//     }
// });

bot.on('typing', (message) => {
    console.log("User { name: '" + message.user.name + "', id: '" + message.user.id + "' } is typing");
});

// bot.on('deleteUserData', (message) => {
//     const userId = message.user.id;
//
//     console.log("Removing user data for user " + message.user.name + ", id: " + message.user.id);
//     Contact.find({userId: userId}).remove().exec();
// });

bot.use(botBuilder.Middleware.dialogVersion({
    version: botConfig.dialogVersion,
    resetCommand: /(\/)?reset$/i,
    message: 'I forgot all.'
}));

// bot.use(botBuilder.Middleware.processGroupMessages());
bot.use(botBuilder.Middleware.sendTyping());

bot.endConversationAction('cancel', canceledTmpl.render(), { matches: /(\/)?cancel$/i });
// bot.beginDialogAction('help', '/help', { matches: /^help/i });

bot.dialog('/', [
    (session) => session.beginDialog('/start')
]);

bot.dialog('/start', [
    (session, args, next) => {
        if (session.message && botUtil.parseCommand(session.message.text)) {
            next({ response: session.message.text });
        } else {
            session.beginDialog('/command', { prompt: starterTmpl.render() });
        }
    },
    (session, args) => {
        if (!args.response) {
            session.endDialog(canceledTmpl.render());
        } else {
            session.beginDialog(`/command/${args.response}`);
        }
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(botBuilder.PromptType.text, botUtil.isCommand));

bot.dialog('/command/schedule', [
    (session) => {
        botBuilder.Prompts.text(session, `Type in some time interval,\ne.g. 5 minutes, 10 seconds, 8 hours, etc.`);
    },
    (session, args, next) => {
        if (args && args.response) {
            const interval = args.response.toLowerCase();
            if (isNaN(hinterval(interval))) {
                session.endDialog("An interval you've entered is incorrect.");
            } else {
                session.userData.interval = interval;
                next();
            }
        } else {
            session.endDialog(canceledTmpl.render());
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
            session.endDialog(canceledTmpl.render());
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
                    cron.parseExpression(args.response);
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
            session.endDialog(canceledTmpl.render());
        }
    },
    (session) => {
        botBuilder.Prompts.text(session, 'Type in the content which you want to repeat');
    },
    (session, args) => {
        if (args && args.response) {
            session.userData.content = args.response;

            const repeatRemindersJob = agenda.create('repeatReminders', {
                jobId: uuid.v4(),
                address: session.message.address,
                content: session.userData.content,
                username: botUtil.getContactNameFromMessage(session.message)
            });
            repeatRemindersJob.repeatEvery(session.userData.interval).save();

            session.endDialog(scheduledTmpl.render({interval: session.userData.interval}));
        } else {
            session.endDialog(canceledTmpl.render());
        }
    }
]);

bot.dialog('/command/fire', [
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
    (session) => {
        const address = session.message.address;

        agenda.jobs({
            'name': 'repeatReminders',
            'data.address.user.id': address.user.id,
            'data.address.conversation.id': address.conversation.id
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

                        text += jobInfoTmpl.render({
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
    (session, args) => {
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
    (session, args) => {
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
    (session) => {
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

                        text += jobInfoTmpl.render({
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
            session.endDialog(canceledTmpl.render());
        } else {
            const jobsIds = session.dialogData.jobsIds;
            const jobsIndexes = args.response.split(",")
                .map((jobIndex) => parseInt(jobIndex) - 1);


            let hasErrors = false;
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

            session.endDialog(hasErrors ? "Finished abort command with errors" : "");
        }
    }
]);

bot.dialog('/command/abortall', [
    (session) => {
        botBuilder.Prompts.text(session, abortAllTmpl.render());
    },
    (session, args) => {
        const decision = args.response;

        // TODO: [y/n], [yes/no]
        if (!decision || (decision !== 'yes' && decision !== 'no')) {
            session.endDialog(canceledTmpl.render());
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