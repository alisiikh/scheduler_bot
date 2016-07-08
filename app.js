var fs = require('fs');
var restify = require('restify');
var skype = require('skype-sdk');

var botService = new skype.BotService({
    messaging: {
        botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
        serverUrl : "https://apis.skype.com",
        requestTimeout : 15000,
        appId: process.env.APP_ID || "dd76f065-6693-471a-a996-cd74cb71c207",
        appSecret: process.env.APP_SECRET || "ATxiZN1nDYkdWzpQAO9wbxW"
    }
});

botService.on('contactAdded', function(bot, data) {
    bot.reply('Hello ' + data.fromDisplayName + '! I\'m FlowFact Skype bot :)', true);
});

botService.on('personalMessage', function(bot, data) {
    bot.reply('Hey ' + data.from + '. Thank you for your message: "' + data.content + '".', true);
});

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var server = restify.createServer();
server.post('/v1/chat', skype.messagingHandler(botService));
server.listen(port, ipAddress, function() {
	console.log('%s, listening for incoming requests on port %s', server.name, server.url);
});
