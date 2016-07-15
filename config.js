'use strict';

module.exports = {
	server: {
		ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
		port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
		ensureHttps: false
	},
	botCfg: {
		botAppId: '74e0ce5a-1742-4540-9abe-ce07ca95a07c',
		botAppSecret: '3O09EvDOJK4DMt6qeuwvMZq'
	},
	databaseURL: (process.env.MONGODB_URL ? process.env.MONGODB_URL + "flowfact-skype-bot" : null)
	    || 'mongodb://127.0.0.1:27017/flowfact-skype-bot'
};

