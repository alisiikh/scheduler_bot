'use strict';


const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const Contact = require('./model').Contact;
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

    console.log(`Job 'sendNotifications' is being fired for ${address.name}!`);

    var message = new botBuilder.Message()
        .address(address)
        .text(`Your one-time reminder:\n\n${content}`);
    bot.send(message);

    done();
});

agenda.define('repeatNotifications', (job, done) => {
    let jobData = job.attrs.data;
    let content = jobData.content;
    let address = jobData.address;

    console.log(`Job 'repeatNotifications' is being fired for ${address.name}!`);

    var message = new botBuilder.Message()
        .address(address)
        .text(`Your repeatable reminder:\n\n${content}`);
    bot.send(message);

    done();
});

agenda.define('abortNotifications', (job, done) => {
    let jobData = job.attrs.data;
    let address = jobData.address;

    let numRemoved = 0;

    agenda.jobs({
        nextRunAt: { $ne: null },
        $or: [{name: 'sendNotifications'}, {name: 'repeatNotifications'}]
    }, function (err, jobs) {

        if (jobs && jobs.length > 0) {
            jobs.forEach((job) => {
                if (job.attrs.data.address.user.id === address.user.id) {
                    job.disable();
                    job.save();
                    numRemoved++;
                }
            });
        }

        const message = new botBuilder.Message().address(address);
        if (numRemoved > 0) {
            message.text(`Stopped ${jobs.length} running jobs.`);
        } else {
            message.text("You have no running jobs, nothing to abort.");
        }
        bot.send(message);

        done();
    });


});

agenda.on('ready', () => {
    console.log("Agenda successfully started and ready to receive job requests.");
    agenda.start();
});

module.exports = agenda;