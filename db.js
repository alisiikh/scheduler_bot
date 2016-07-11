var dbName = 'flowfact-skype-bot';
var mongoHost = process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var mongoPort = '27017';

module.exports.mongoUrl = process.env.MONGODB_URL 
	|| ('mongodb://' + mongoHost + ':' + mongoPort + '/' + dbName);
