'use strict';


const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('agenda')({
    db: {
        address: require('./config').databaseURL
    },
    processEvery: '30 seconds',
    maxConcurrency: 20
});

agenda.define('sendNotifications', (job, done) => {
    const jobData = job.attrs.data;
    const content = jobData.content;
    const address = jobData.address;

    console.log(`Job 'sendNotifications' is fired for ${address.user.name}!`);

    const message = new botBuilder.Message()
        .address(address)
        .text(`Your one-time reminder:\n\n${content}`);
    bot.send(message);

    done();
});

agenda.define('repeatNotifications', (job, done) => {
    const jobData = job.attrs.data;
    const content = jobData.content;
    const address = jobData.address;

    console.log(`Job 'repeatNotifications' is fired for ${address.user.name}!`);

    const message = new botBuilder.Message()
        .address(address)
        .text(`Your repeatable reminder:\n\n${content}`);
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

agenda.on('ready', () => {
    console.log("Agenda successfully started and ready to receive job requests.");
    agenda.start();
});

module.exports = agenda;