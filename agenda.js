var Agenda = require('agenda');
var mongoUrl = require('./db').mongoUrl;
var botService = require('./skype-bot-service');
var SkypeAddress = require('./model').SkypeAddress;

var agenda = new Agenda({ db: { address: mongoUrl }, processEvery: '30 seconds' });
agenda.define('sendNotifications', function(job, done) {
	var jobData = job.attrs.data;
	var content = jobData.content;

	console.log("Send notifications job is fired! Content: " + content);

	SkypeAddress.find({}, function(err, addresses) {
		if (err) {
			console.error("Error during fetching skype addresses!", err);
			return;
		}

		console.log("Found " + addresses.length + " addresses, sending notifications to all of them!");

		addresses.forEach(function(address) {
			console.log("Sending notification to skype contact " + address.skypeId);
			try {
			   var message = "Kapusta! Please pay attention to the following lines!\n\n";
			   message += content;
			   message += "\n\nThanks for your time " + address.displayName + "! (movember)";

			   botService.send(address.skypeId, message);
		    } catch (e) {
               console.error("Failed to send reminder to skype contact " + address.skypeId, e);
               return;
		    }
		});

		done();
	});
});

agenda.on('ready', function() {
	console.log("Agenda successfully started and ready to receive job requests.");	
	agenda.start();
});

module.exports = agenda;