'use strict';

const restify = require('restify');
const agenda = require('./agenda');
const skype = require('skype-sdk');
const botService = require('./skype-bot-service');
const appCfg = require('./config');

const server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));
server.post('/v1/chat', skype.messagingHandler(botService));
server.listen(appCfg.port, appCfg.ipAddress, () => {
   console.log('Server is listening for incoming requests on port %s', server.url);
});

module.exports = server;