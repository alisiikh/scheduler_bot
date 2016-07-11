var restify = require('restify');
var skype = require('skype-sdk');
var mongoose = require('mongoose');
var server = require('./server');
var agenda = require('./agenda');

var SkypeAddress = require('./model').SkypeAddress;

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
    var skypeAddress = new SkypeAddress({ 
        "skypeId": data.from, 
        "displayName": data.fromDisplayName,
        "dateCreated": new Date()
    });
    skypeAddress.save(function(err) {
        if (!err) {
           console.log("Stored new skype contact with a name: " + data.from);
        }
    });

    bot.reply("Hello, " + data.fromDisplayName + "! I've stored you to my " 
        + "database so that you will not miss my notifications. \n" 
        + "Data received: \n" + JSON.stringify(data));
});

botService.on('personalMessage', function(bot, data) {
    bot.reply(JSON.stringify(data), true);
});

server.post('/v1/chat', skype.messagingHandler(botService));