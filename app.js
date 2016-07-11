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
    var skypeId = data.from;
    var displayName = data.displayName;

    SkypeAddress.find({ "skypeId": skypeId }, function(err, skypeAddresses) {
        if (err) {
            console.error("Failed to execute findBySkypeId(). Reason: " + err);
            return;
        }

        if (skypeAddresses.length != 0) {
            bot.reply("I already have contact with name " + skypeId 
                + ", so I will remind you when time comes"); 

            bot.reply("Reply true", true);
            return;
        }

        var skypeAddress = new SkypeAddress({ 
            "skypeId": skypeId, 
            "displayName": displayName,
            "dateCreated": new Date()
        });

        skypeAddress.save(function(err) {
            if (!err) {
                console.log("Stored new skype contact with a name: " + skypeId);
            }
        });

        bot.reply("Hello, " + displayName + "! I've stored you to my " 
            + "database so that you will not miss my notifications. \n" 
            + "Data received: \n" + JSON.stringify(data));

        agenda.on('ready', function() {
            agenda.schedule('in 1 minute', 'notify skype contact', { "skypeId": skypeId, "bot": bot });
            agenda.start();
        });
    });
});

botService.on('personalMessage', function(bot, data) {
    bot.reply(JSON.stringify(data), true);

    agenda.on('ready', function() {
        agenda.schedule('in 1 minute', 'notify skype contact', { "skypeId": data.from, "bot": bot });
        agenda.start();
    });
});

server.post('/v1/chat', skype.messagingHandler(botService));