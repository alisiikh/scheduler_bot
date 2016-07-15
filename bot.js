'use strict';

const botCfg = require('./config').botCfg;
const botBuilder = require('botbuilder');

const botConnector = new botBuilder.ChatConnector({
    appId: botCfg.botAppId,
    appSecret: botCfg.botAppSecret
});

const bot = new botBuilder.UniversalBot(botConnector);

module.exports = {
    botBuilder,
    bot,
    botConnector
};

