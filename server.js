'use strict';

const restify = require('restify');
const skype = require('skype-sdk');
const botService = require('./skype-bot-service');
const serverCfg = require('./config').server;

const server = restify.createServer({
   name: 'flowfact-skype-bot-server'
});
server.use(restify.acceptParser(server.acceptable));

if (serverCfg.ensureHttps) {
   server.use(skype.ensureHttps(true));
}

server.use(restify.bodyParser({ mapParams: true }));
server.post('/v1/chat', skype.messagingHandler(botService));

server.listen(serverCfg.port, serverCfg.ipAddress, () => {
   console.log('Server is listening for incoming requests on port %s', server.url);
});

module.exports = server;