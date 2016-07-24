'use strict';

const restify = require('restify');
const bot = require('./bot').bot;
const botConnector = require('./bot').botConnector;
const serverCfg = require('./config').server;
const swig = require('./swig');

const privacyHtmlTmpl = swig.compileFile('template/html/privacy.html');
const termsHtmlTmpl = swig.compileFile('template/html/terms.html');

const server = restify.createServer({
    name: 'botServer'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({mapParams: true}));

server.post('/api/v3/chat', botConnector.listen());

server.get('/bot/terms', (req, res) => {
    const body = termsHtmlTmpl();
    res.writeHead(200, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': 'text/html'
        });
    res.write(body);
    res.end();
});

server.get('/bot/privacy', (req, res) => {
    const body = privacyHtmlTmpl();
    res.writeHead(200, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': 'text/html'
        });
    res.write(body);
    res.end();
});

server.listen(serverCfg.port, serverCfg.ipAddress, () => {
    console.log('%s is listening for incoming requests on port %s', server.name, server.url);
});

module.exports = server;