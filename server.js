'use strict';

const restify = require('restify');
const agenda = require('./agenda');
const skype = require('skype-sdk');
const botService = require('./skype-bot-service');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

const server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));
server.post('/v1/chat', skype.messagingHandler(botService));
server.post('/retro', function(req, res, next) {
    const content = req.params.content;
    const reminderDate = req.params.reminderDate;

    agenda.cancel({ name: 'sendNotifications' }, (err, numRemoved) => {
        if (err) {
            console.error("Failed to remove 'send notification' jobs");
        } else {
            console.log("Removed " + numRemoved + " 'send notification' jobs");

            agenda.schedule(reminderDate, 'sendNotifications', { "content": content });

            console.log("Scheduled new retro reminder job");
        }
    });

    const body = "Retro reminder has been scheduled " + reminderDate + " with content:\n" + content;
    res.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain'
    });
    res.write(body);
    res.end();
});
server.listen(port, ipAddress, () => {
   console.log('Server is listening for incoming requests on port %s', server.url);
});