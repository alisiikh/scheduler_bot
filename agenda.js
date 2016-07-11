var Agenda = require('agenda');
var mongoUrl = require('./db').mongoUrl;
var botService = require('./skype-bot-service');
var SkypeAddress = require('./model').SkypeAddress;

console.log(botService);

var agenda = new Agenda({ db: { address: mongoUrl }, processEvery: '30 seconds' });
agenda.define('send notifications', function(job, done) {
	console.log("Send notifications job is fired!");

	var jobData = job.attrs.data;
	var content = jobData.content;

	console.log("Send notifications job is fired! Content: " + content);

	SkypeAddress.find({}, function(err, addresses) {
		if (err) {
			console.error("Error during fetching skype addresses!", err);
			return;
		}

		console.log("Found " + addresses.length + " addresses, sending notifications");

		addresses.forEach(function(address) {
			console.log("SkypeId: " + address.skypeId);
			botService.send(address.skypeId, content);
		});

		done();
	});
});

agenda.on('ready', function() {
	console.log("Agenda successfully started");	
	agenda.start();
});

module.exports = agenda;