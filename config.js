'use strict';

module.exports = {
	server: {
		ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
		port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
		ensureHttps: false
	},
	skype: {
		botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
		skypeApiURL: "https://apis.skype.com",
		skypeAppId: process.env.SKYPE_APP_ID,
		skypeAppSecret: process.env.SKYPE_APP_SECRET,
		requestTimeout: 15000,
		enableRequestDebugging: true
	},
	databaseURL: (process.env.MONGODB_URL ? process.env.MONGODB_URL + "flowfact-skype-bot" : null) || 'mongodb://127.0.0.1:27017/flowfact-skype-bot'
};