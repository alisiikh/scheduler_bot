var restify = require('restify');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var server = restify.createServer();
server.listen(port, ipAddress, function() {
   console.log('%s, listening for incoming requests on port %s', server.name, server.url);
});

module.exports = server;