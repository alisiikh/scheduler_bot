var Agenda = require('agenda');
var mongoUrl = require('./db').mongoUrl;

var agenda = new Agenda({db: {address: mongoUrl}});

agenda.define('notify skype contact', function(job, done) {
	var jobData = job.attrs.data;
	var skypeAddress = jobData.skypeAddress;
	var bot = jobData.bot;

	bot.reply("Delayed message from bot for " + skypeAddress, true);
});

module.exports = agenda;