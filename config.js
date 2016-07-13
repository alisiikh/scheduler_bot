'use strict';

module.exports = {
	port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
	ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
	databaseURL: process.env.MONGODB_URL || 'mongodb://localhost:27017/flowfact-skype-bot',
	botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
	skypeApiURL: "https://apis.skype.com",
	skypeAppId: process.env.SKYPE_APP_ID,
	skypeAppSecret: process.env.SKYPE_APP_SECRET
}