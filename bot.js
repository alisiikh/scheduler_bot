'use strict';

const botCfg = require('./config').bot;
const botBuilder = require('botbuilder');

const botConnector = new botBuilder.ChatConnector({
    appId: botCfg.botAppId,
    appPassword: botCfg.botAppSecret
});

const bot = new botBuilder.UniversalBot(botConnector);

module.exports = {
    bot,
    botBuilder,
    botConnector
};

