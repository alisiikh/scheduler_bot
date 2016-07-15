'use strict';

const skype = require('skype-sdk');
const skypeCfg = require('./config').skype;

module.exports = new skype.BotService({
    messaging: {
        botId: skypeCfg.botId,
        serverUrl : skypeCfg.skypeApiURL,
        requestTimeout : skypeCfg.requestTimeout,
        appId: skypeCfg.skypeAppId,
        appSecret: skypeCfg.skypeAppSecret,
        enableRequestDebugging: skypeCfg.enableRequestDebugging
    }
});