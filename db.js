'use strict';

const dbName = 'flowfact-skype-bot';
const mongoHost = process.env.OPENSHIFT_NODEJS_IP || 'localhost';
const mongoPort = '27017';

module.exports.mongoUrl = process.env.MONGODB_URL 
	|| ('mongodb://' + mongoHost + ':' + mongoPort + '/' + dbName);
