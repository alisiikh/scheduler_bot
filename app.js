'use strict';

const server = require('./server');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');

bot.dialog('/', [
    (session, args, next) => {
        console.log("/ dialog started");

        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    (session, results) => {
        console.log(`Final result is ${session.userData.name}`);
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    (session) => {
        console.log("/profile dialog started");

        botBuilder.Prompts.text(session, 'Hi! What is your name?');
    },
    (session, results) => {
        console.log(`username is: ${results.response}`);
        session.userData.name = results.response;
        session.endDialog();
    }
]);