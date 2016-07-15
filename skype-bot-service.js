'use strict';

const skype = require('skype-sdk');
const appCfg = require('./config');

module.exports = new skype.BotService({
    messaging: {
        botId: appCfg.botId,
        serverUrl : appCfg.skypeApiURL,
        requestTimeout : 15000,
        appId: appCfg.skypeAppId,
        appSecret: appCfg.skypeAppSecret
    }
});