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
    var command = data.content;
    

    function onError() {
        var replyErrorMessage = "Command is incorrect, please see examples below:\n\n";
        replyErrorMessage += "Example Usages: \n\nschedule | 1 minute | Retro was brilliant!";
        bot.reply(replyErrorMessage, true);
    }

    try {
        var parsedCommand = command.split('|', 3);
        if (parsedCommand.length != 3) {
            throw new Error("Incorrect command: " + parsedCommand);
            onError();
            return;
        }

        var commandName = parsedCommand[0].trim();
        var humanInterval = parsedCommand[1].trim();
        var content = parsedCommand[2].trim();

        if (commandName != 'schedule') {
            throw new Error("Incorrect command name, was: " + commandName);
            return;
        }
    } catch (e) {
        console.error("Failed to parse bot command", e);
        onError();
        return;
    }

    var replyMessage = "Mr. " + data.fromDisplayName + ", thank you for scheduling a reminder job!\n\n";
    agenda.schedule(humanInterval, 'send notifications', { "content": content });

    replyMessage += "Scheduled new retro reminder job.\n\n";
    replyMessage += "Will be fired at X date";

    bot.reply(replyMessage, true);


/*    agenda.cancel({ name: 'send notifications' }, function(err, numRemoved) {
        if (err) {
            console.error("Failed to remove 'send notification' jobs");

            bot.reply("Excuse me, Mr. Cat, I've failed to remove stale jobs, please contact Mr. Aleksey!\n\nBest regards, \nFlowFact BOT", true);
        } else {
            var replyMessage = "Mr. " + data.fromDisplayName + ", thank you for scheduling a reminder job!\n\n";

            replyMessage += "Removed " + numRemoved + " stale reminder jobs.\n";

            agenda.schedule(humanInterval, 'send notifications', { "content": content });

            replyMessage += "Scheduled new retro reminder job.\n\n";
            replyMessage += "Will be fired at X date";

            bot.reply(replyMessage, true);
        }
    });*/
});

module.exports = botService;