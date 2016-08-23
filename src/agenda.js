'use strict';

const MD = require('./util/mdutil');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const config = require('./config');
const swig = require('./swig');


const singeNotificationTmpl = swig.compileFile('template/md/single_notification.md');
const repeatableNotificationTmpl = swig.compileFile('template/md/repeatable_notification.md');

const agenda = require('agenda')({
    db: {
        address: config.mongo.databaseURL
    },
    processEvery: config.agenda.processEvery,
    maxConcurrency: config.agenda.maxConcurrency
});

agenda.define('sendNotifications', (job, done) => {
    const jobData = job.attrs.data;
    const content = MD.convertPlainTextToMarkdown(jobData.content);
    const address = jobData.address;
    const username = jobData.username || address.user.name;

    console.log(`Job 'sendNotifications' is fired for ${address.user.name}!`);

    const message = new botBuilder.Message()
        .address(address)
        .text(singeNotificationTmpl({ isGroup: address.conversation.isGroup, username: username, content: content }));
    bot.send(message);

    done();
});

agenda.define('repeatNotifications', (job, done) => {
    const jobData = job.attrs.data;
    const content = MD.convertPlainTextToMarkdown(jobData.content);
    const address = jobData.address;
    const username = jobData.username || address.user.name;

    console.log(`Job 'repeatNotifications' is fired for ${address.user.name}!`);

    const message = new botBuilder.Message()
        .address(address)
        .text(repeatableNotificationTmpl({ isGroup: address.conversation.isGroup, username: username, content: content }));
    bot.send(message);

    done();
});

agenda.define('abortNotifications', {priority: 'high'}, (job, done) => {
    const jobData = job.attrs.data;
    const address = jobData.address;

    agenda.cancel({
        $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}],
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

agenda.define('abortOneNotification', {priority: 'high'}, (job, done) => {
    const jobData = job.attrs.data;
    const address = jobData.address;
    const jobId = jobData.jobId;

    agenda.cancel({
        $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}],
        'data.jobId': jobId
    }, (err, numRemoved) => {
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

agenda.define("cleanUpFinishedNotifications", {priority: 'high'}, (job, done) => {
    console.log(`Job cleanUpFinishedNotifications has been started`);

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
    console.log("Agenda successfully started and ready to receive job requests.");
    agenda.start();

    console.log(`Starting jobs cleanup job with interval of ${config.agenda.cleanUpInterval}`);
    agenda.every(config.agenda.cleanUpInterval, 'cleanUpFinishedNotifications');
});

module.exports = agenda;