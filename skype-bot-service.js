'use strict';

const skype = require('skype-sdk');
const SkypeAddress = require('./model').SkypeAddress;

const botService = new skype.BotService({
    messaging: {
        botId: 'dd76f065-6693-471a-a996-cd74cb71c207',
        serverUrl : "https://apis.skype.com",
        requestTimeout : 15000,
        appId: process.env.SKYPE_APP_ID,
        appSecret: process.env.SKYPE_APP_SECRET
    }
});

module.exports = botService;