const fs = require('fs');
const restify = require('restify');
const skype = require('skype-sdk');

const botService = new skype.BotService({
    messaging: {
        botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
        serverUrl : "https://apis.skype.com",
        requestTimeout : 15000,
        appId: process.env.APP_ID || "dd76f065-6693-471a-a996-cd74cb71c207",
        appSecret: process.env.APP_SECRET || "ATxiZN1nDYkdWzpQAO9wbxW"
    }
});

botService.on('contactAdded', (bot, data) => {
    bot.reply(`Hello ${data.fromDisplayName}! I'm FlowFact Skype bot :)`, true);
});

botService.on('personalMessage', (bot, data) => {
    bot.reply(`Hey ${data.from}. Thank you for your message: "${data.content}".`, true);
});

const port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
// const ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

const server = restify.createServer();
server.post('/v1/chat', skype.messagingHandler(botService));
server.listen(port);
console.log('Listening for incoming requests on port ' + port);