var skype = require('skype-sdk');
var humanInterval = require('human-interval');
var SkypeAddress = require('./model').SkypeAddress;

var botService = new skype.BotService({
    messaging: {
        botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
        serverUrl : "https://apis.skype.com",
        requestTimeout : 15000,
        appId: process.env.SKYPE_APP_ID || "dd76f065-6693-471a-a996-cd74cb71c207",
        appSecret: process.env.SKYPE_APP_SECRET || "ATxiZN1nDYkdWzpQAO9wbxW"
    }
});

module.exports = botService;