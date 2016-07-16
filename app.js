'use strict';

const async = require('async');
const server = require('./server');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const Contact = require('./model').Contact;

bot.dialog('/', [
    (session, args, next) => {
        const message = session.message;
        const user = message.user;

        const onContactResolved = (contact) => {
            session.userData.user = contact;

            session.beginDialog('/command');
        };

        if (!session.userData.user) {
            Contact.findOne({userId: user.id}, (err, contact) => {
                if (!contact) {
                    const contact = new Contact({
                        userId: user.id,
                        name: user.name,
                        dateCreated: new Date()
                    });
                    contact.save().then((contact) => {
                        session.send(`Hello, ${user.name}!`);

                        onContactResolved(contact);
                    });
                } else {
                    onContactResolved(contact);
                }
            });
        } else {
            onContactResolved(session.userData.user);
        }
    }
]);

bot.dialog('/command', [
    (session, args) => {
        if (!session.dialogData.command) {
            botBuilder.Prompts.text(session, "Commands:\n\tschedule, repeat, cancel\n\nType in your choice, please:");
        }
    },
    (session, args) => {
        if (/^(schedule|repeat|cancel)$/i.test(args.response)) {
            session.dialogData.command = args.response;

            session.beginDialog(`/command/${session.dialogData.command}`);
        } else {
            session.send("Sorry, I don't understand you, please try again!");
            session.endDialog();
            session.beginDialog('/command');
        }
    }
]);

bot.dialog('/command/schedule', [
    (session) => {
        session.send("So you chose schedule command, nice!");
        session.endDialog();
    }
]);

bot.dialog('/command/repeat', [
    (session) => {
        session.send("So you chose repeat command, nice!");
        session.endDialog();
    }
]);

bot.dialog('/command/cancel', [
    (session) => {
        session.send("So you chose cancel command, nice!");
        session.endDialog();
    }
]);