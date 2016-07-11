var skype = require('skype-sdk');
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
            bot.reply("Hello again, " + displayName + "!"); 
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

        bot.reply("Hello, I'm a bot for reminding FLOWFACT Mobile team about their retro stuff. " 
        	+ "Because they are used to forget :)");
    });
});

botService.on('personalMessage', function(bot, data) {
    bot.reply("You can send me a POST request to ", true);
});

module.exports = botService;