var dbName = 'flowfact-skype-bot';
var mongoHost = process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var mongoPort = '27017';

module.exports.mongoUrl = 'mongodb://' + mongoHost + ':' + mongoPort + '/' + dbName;
