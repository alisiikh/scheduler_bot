'use strict';

import * as restify from 'restify';
import { connector } from './bot'

const server = restify.createServer({
    name: 'server'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({mapParams: true}));

server.post('/api/v1/chat', function (req, res) {
    return connector.listen()(req, res);
});

const emptyRoute = function(req, res) {
    const msg = "Under construction...";
    res.writeHead(200, {
        'Content-Length': msg.length,
        'Content-Type': 'text/html'
    });
    res.write(msg);
    res.end();
};

server.get('/bot/terms', emptyRoute);
server.get('/bot/privacy', emptyRoute);

module.exports = server;