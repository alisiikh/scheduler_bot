'use strict';

const Agenda = require('agenda');
const botService = require('./skype-bot-service');
const SkypeAddress = require('./db').SkypeAddress;
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
	let skypeId = jobData.skypeId;
	let target = jobData.target;

	console.log(`Job 'sendNotifications' is being fired for skypeId: ${skypeId}!`);

	SkypeAddress.findOne({ "skypeId": skypeId }, (err, initiator) => {
		if (!initiator) {
			botService.send(skypeId, "Whoa, I can't find your info in database! :(");
			return;
		}

		if (target === "me") {
			botService.send(initiator.skypeId, `Your personal reminder:\n\n${content}`);
		} else if (target === "all") {
			SkypeAddress.find({}, (err, skypeAddresses) => {

				skypeAddresses.forEach((skypeAddress) => {
					console.log(`Sending message to skypeId: ${skypeAddress.skypeId}`);

					botService.send(skypeAddress.skypeId, `A message from ${initiator.displayName}:\n\n${content}`);
				});
			});
		} else {
			console.log("No target specified for sendNotifications job");
		}
	});
});

agenda.define('removeContact', (job, done) => {
	let jobData = job.attrs.data;
	let skypeId = jobData.skypeId;

	SkypeAddress.findOne({ "skypeId" : skypeId }, (err, skypeAddress) => {
		if (!skypeAddress) {
			botService.send(skypeId, "Whoa, I can't find your info in database! :(");
			return;
		}

		skypeAddress.remove((err) => {
			if (!err) {
				console.log(`Removed skype contact from db with skypeId: ${skypeId}`);
			}
		});
	});
});

agenda.define('abortNotifications', (job, done) => {
	let jobData = job.attrs.data;
	let skypeId = jobData.skypeId;

	agenda.jobs({ name: 'sendNotifications' }, function(err, jobs) {
		if (jobs && jobs.length > 0) {
			jobs.forEach((job) => {
				job.remove();
			});
		}
		done();
	});
	
	botService.send(skypeId, "Cleared your jobs history and current running jobs");
});

agenda.on('ready', () => {
	console.log("Agenda successfully started and ready to receive job requests.");	
	agenda.start();
});

module.exports = agenda;