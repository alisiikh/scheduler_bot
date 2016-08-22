'use strict';

const databaseName = "scheduler_bot";

let databaseURL;
if (process.env.MONGODB_URL) {
	databaseURL = `${process.env.MONGODB_URL}${databaseName}`;
} else {
	databaseURL = `mongodb://127.0.0.1:27017/${databaseName}`;
}

module.exports = {
	server: {
		ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
		port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
		ensureHttps: false
	},
	bot: {
		botAppId: process.env.BOT_FRAMEWORK_APP_ID,
		botAppSecret: process.env.BOT_FRAMEWORK_APP_SECRET,
		dialogVersion: 1.1
	},
	mongo: {
		databaseURL: databaseURL
	},
    agenda: {
	    processEvery: '30 seconds',
        maxConcurrency: 20,
        cleanUpInterval: '1 day'
    }
};

