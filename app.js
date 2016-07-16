'use strict';

const async = require('async');
const server = require('./server');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const Contact = require('./model').Contact;
const botCfg = require('./config').bot;

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
            const commands = ["schedule", "repeat", "cancel"];
            if (botCfg.choiceEnabled) {
                botBuilder.Prompts.choice(session, "Make your choice, please:", commands);
            } else {
                botBuilder.Prompts.text(session, `Choose a command from: \n\n[${commands.join(', ')}]`)
            }
        }
    },
    (session, args) => {
        const command = botCfg.choiceEnabled ? args.response.entity : args.response;

        if (/^(schedule|repeat|cancel)$/i.test(command)) {
            session.dialogData.command = command;

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