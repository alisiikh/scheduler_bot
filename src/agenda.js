'use strict';

import { bot, botBuilder } from './bot';
import config from './config';
import nunjucks from './nunjucks';

const singleReminderTmpl = nunjucks.getTemplate('single-reminder.md');
const repeatReminderTmpl = nunjucks.getTemplate('repeat-reminder.md');

const agenda = require('agenda')({
    db: {
        address: config.mongo.databaseURL
    },
    processEvery: config.agenda.processEvery,
    maxConcurrency: config.agenda.maxConcurrency
});

agenda.define('sendReminders', (job, done) => {
    const jobData = job.attrs.data;
    const content = jobData.content;
    const address = jobData.address;
    const username = jobData.username || address.user.name;

    console.log(`Job '${job.attrs.name}' is fired for ${username}!`);

    const msg = new botBuilder.Message()
        .address(address)
        .text(singleReminderTmpl.render({
            isGroup: address.conversation.isGroup,
            username: username,
            content: content
        }));
    bot.send(msg);

    done();
});

agenda.define('repeatReminders', (job, done) => {
    const jobData = job.attrs.data;
    const content = jobData.content;
    const address = jobData.address;
    const username = jobData.username || address.user.name;

    console.log(`Job '${job.attrs.name}' is fired for ${username}!`);

    const message = new botBuilder.Message()
        .address(address)
        .text(repeatReminderTmpl.render({
            isGroup: address.conversation.isGroup,
            username: username,
            content: content }));
    bot.send(message);

    done();
});

agenda.define('abortReminders', {priority: 'high'}, (job, done) => {
    const jobData = job.attrs.data;
    const address = jobData.address;

    agenda.cancel({
        $or: [{name: 'sendReminders'}, {name: 'repeatReminders'}],
        'data.address.user.id': address.user.id
    }, (err, numRemoved) => {
        const message = new botBuilder.Message().address(address);

        if (err) {
            message.text("Failed to remove jobs, error occurred");
        } else {
            if (numRemoved > 0) {
                message.text(`Stopped and removed ${numRemoved} running jobs.`);
            } else {
                message.text("You have no jobs, nothing to abort.");
            }
        }

        bot.send(message);
    });

    done();
});

agenda.define('abortOneReminder', {priority: 'high'}, (job, done) => {
    const jobData = job.attrs.data;
    const address = jobData.address;
    const jobId = jobData.jobId;

    agenda.cancel({ 'data.jobId': jobId }, (err, numRemoved) => {
        const message = new botBuilder.Message().address(address);

        if (!err) {
            message.text(`Removed job with id ${jobId}`);
        } else {
            message.text(`Failed to remove job with id ${jobId}`);
        }

        bot.send(message);
    });

    done();
});

agenda.define("cleanUpStaleReminders", {priority: 'high'}, (job, done) => {
    console.log(`Job cleanUpStaleReminders has been started`);

    agenda.cancel({
        'nextRunAt': {$eq: null}
    }, (err, numRemoved) => {
        if (!err) {
            if (numRemoved > 0) {
                console.log(`Cleaned up ${numRemoved} non-active jobs`);
            }
        } else {
            console.error("Failed to remove non-active jobs", err);
        }
    });

    done();
});

agenda.on('ready', () => {
    const handleIndexError = (err) => {
        if (err) {
            console.error("Failed to create index", err);
        }
    };

    agenda._collection.createIndex({'data.jobId': 1}, {'name': 'jobId_idx'}, handleIndexError);
    agenda._collection.createIndex({'data.address.user.id': 1, 'name': 1}, {'name': 'userId_name_idx'}, handleIndexError);
    agenda._collection.createIndex({'name': 1, 'data.address.user.id': 1, 'data.jobId': 1},
        {name: 'name_userId_jobId_idx'}, handleIndexError);
    agenda._collection.createIndex({'name': 1, 'data.address.user.id': 1, 'data.address.conversation.id': 1,
        'nextRunAt': 1}, {'name': 'name_userId_conversationId_nextRunAt_idx'}, handleIndexError);

    console.log("Agenda successfully started and ready to receive job requests.");
    agenda.start();

    console.log(`Starting jobs cleanup job with interval of ${config.agenda.cleanUpInterval}`);
    agenda.every(config.agenda.cleanUpInterval, 'cleanUpStaleReminders');
});

module.exports = agenda;