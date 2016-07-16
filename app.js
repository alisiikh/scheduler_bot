'use strict';

const async = require('async');
const server = require('./server');
const bot = require('./bot').bot;
const botBuilder = require('./bot').botBuilder;
const agenda = require('./agenda');
const Contact = require('./model').Contact;
const botCfg = require('./config').bot;
const intents = new botBuilder.IntentDialog();

const commands = ["schedule", "repeat", "cancel"];

bot.dialog('/', [
    (session, args, next) => {
        const message = session.message;
        const user = message.user;

        const onContactResolved = (contact) => {
            session.userData.user = contact;

            next();
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
    },
    (session, args) => {
        const prompt = `Choose a command from: \n\n[${commands.join(', ')}]`;
        session.beginDialog('/command', {
            prompt: prompt,
            retryPrompt: `Sorry, I don't understand you, please try again!\n\n${prompt}`
        });
    },
    (session, args) => {
        session.dialogData.command = args.response;

        session.beginDialog(`/command/${session.dialogData.command}`);
    }
]);

bot.dialog('/command', botBuilder.DialogAction.validatedPrompt(botBuilder.PromptType.text,
    (response) => /^(schedule|repeat|cancel)$/i.test(response)));

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