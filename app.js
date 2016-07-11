var restify = require('restify');
var skype = require('skype-sdk');
var botService = require('./skype-bot-service');
var agenda = require('./agenda');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));
server.post('/v1/chat', skype.messagingHandler(botService));
server.post('/retro', function(req, res, next) {
    var content = req.params.content;
    var reminderDate = req.params.reminderDate;

    agenda.cancel({ name: 'send notifications' }, function(err, numRemoved) {
        if (err) {
            console.error("Failed to remove 'send notification' jobs");
        } else {
            console.log("Removed " + numRemoved + " 'send notification' jobs");

            agenda.schedule(reminderDate, 'send notifications', { "content": content });

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

module.exports = server;