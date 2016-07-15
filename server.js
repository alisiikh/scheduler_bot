'use strict';

const restify = require('restify');
const bot = require('./bot').bot;
const botConnector = require('./bot').botConnector;
const serverCfg = require('./config').server;

const server = restify.createServer({
   name: 'botServer'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));
server.post('/api/v3/chat', botConnector.listen());

server.listen(serverCfg.port, serverCfg.ipAddress, () => {
   console.log('%s is listening for incoming requests on port %s', server.name, server.url);
});

module.exports = server;