var restify = require('restify');
var skype = require('skype-sdk');
var botService = require('./skype-bot-service');
var agenda = require('./agenda');
var SkypeAddress = require('./model');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));
server.post('/v1/chat', skype.messagingHandler(botService));
server.post('/retro', function(req, res, next) {
    var content = req.params.content;
    var reminderDate = req.params.reminderDate;

    agenda.cancel({ name: 'sendNotifications' }, function(err, numRemoved) {
        if (err) {
            console.error("Failed to remove 'send notification' jobs");
        } else {
            console.log("Removed " + numRemoved + " 'send notification' jobs");

            agenda.schedule(reminderDate, 'sendNotifications', { "content": content });

            console.log("Scheduled new retro reminder job");
        }
    });

    var body = "Retro reminder has been scheduled " + reminderDate + " with content:\n" + content;
    res.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain'
    });
    res.write(body);
    res.end();
});
server.listen(port, ipAddress, function() {
   console.log('Server is listening for incoming requests on port %s', server.url);
});

botService.on('contactAdded', function(bot, data) {
    var skypeId = data.from;
    var displayName = data.displayName;

    SkypeAddress.find({ "skypeId": skypeId }, function(err, skypeAddresses) {
        if (err) {
            console.error("Failed to find skype contacts.", err);
            return;
        }

        if (skypeAddresses.length != 0) {
            bot.reply("Hello again, " + displayName + "! Nice to see you back! :)"); 
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
            } else {
                console.error("Failed to store skype contact " + skypeId);
            }
        });

        bot.reply("Hello, FlowFacter! I'm your reminder sender to any contact I'm added to! :)");
    });
});

botService.on('personalMessage', function(bot, data) {
    var command = data.content;
    if (command.startsWith('Edited')) {
        return;
    }

    function onError() {
        var replyErrorMessage = "Command is incorrect, please see examples below:\n\n";
        replyErrorMessage += "Example Usages: \n\nschedule | 1 minute | Retro was brilliant!";
        bot.reply(replyErrorMessage, true);
    }

    try {
        var parsedCommand = command.split('|', 3);
        if (parsedCommand.length != 3) {
            throw new Error("Incorrect command: " + parsedCommand);
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

    console.log("Scheduling notification to be sent with content:\n\n" + content);
    try {
        agenda.schedule(humanInterval, 'sendNotifications', { "content": content });
    } catch (e) {
        console.error("Failed to schedule notification", e);
        bot.reply("Error occurred during scheduling reminder", true);
        return;
    }
    
    var replyMessage = "Scheduled new reminder job";
    bot.reply(replyMessage, true);
});
