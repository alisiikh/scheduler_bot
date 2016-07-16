'use strict';

const Agenda = require('agenda');
const bot = require('./bot').bot;
const Contact = require('./model').Contact;
const appCfg = require('./config');

const agenda = new Agenda({ 
	db: { 
		address: appCfg.databaseURL
	},
	processEvery: '30 seconds',
	maxConcurrency: 20
});

agenda.define('sendNotifications', (job, done) => {
	let jobData = job.attrs.data;
	let content = jobData.content;
	let userId = jobData.userId;
	let target = jobData.target;

	console.log(`Job 'sendNotifications' is being fired for skypeId: ${userId}!`);

	Contact.findOne({ "userId": userId }, (err, initiator) => {
		if (target === "me") {
			bot.send(initiator.userId, `Your personal one-time reminder:\n\n${content}`);
		} else if (target === "all") {
			Contact.find({}, (err, skypeAddresses) => {
				skypeAddresses.forEach((skypeAddress) => {
					console.log(`Sending message to skypeId: ${skypeAddress.userId}`);

					bot.send(skypeAddress.userId, `A message from ${initiator.name}:\n\n${content}`);
				});
			});
		} else {
			console.log("No target specified for sendNotifications job");
		}
	});

	done();
});

agenda.define('repeatNotifications', (job, done) => {
	let jobData = job.attrs.data;
	let content = jobData.content;
	let skypeId = jobData.userId;

	bot.send(skypeId, `Your personal repeatable reminder:\n\n${content}`);

	done();
});

agenda.define('removeContact', (job, done) => {
	let jobData = job.attrs.data;
	let userId = jobData.userId;

	Contact.findOne({ "userId" : userId }, (err, skypeAddress) => {
		if (!skypeAddress) {
			bot.send(userId, "Whoa, I can't find your info in database! :(");
			return;
		}

		skypeAddress.remove((err) => {
			if (!err) {
				console.log(`Removed skype contact from db with skypeId: ${userId}`);
			}

			bot.send(userId, "It's sad to see you go, hope you will return someday ;(");
		});
	});

	done();
});

agenda.define('abortNotifications', (job, done) => {
	let jobData = job.attrs.data;
	let userId = jobData.userId;

	agenda.jobs({ $or: [{ name: 'sendNotifications' }, { name: 'repeatNotifications' }] }, function(err, jobs) {
		if (jobs && jobs.length > 0) {
			jobs.forEach((job) => {
				if (job.attrs.data.userId === userId) {
					job.remove();
				}
			});
		}
	});

	bot.send(userId, "Cleared your jobs history and current running jobs");
	done();
});

agenda.on('ready', () => {
	console.log("Agenda successfully started and ready to receive job requests.");	
	agenda.start();
});

module.exports = agenda;