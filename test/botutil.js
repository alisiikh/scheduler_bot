const BotUtil = require('../src/botutil');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe("", () => {
    describe("test for getContactNameFromMessage() util method", () => {
        it("Get Skype username from message", (done) => {
            const message = {
                user: {
                    name: "fake_name",
                    id: "fake_id"
                },
                address: {
                    channelId: 'skype'
                }
            };
            const username = BotUtil.getContactNameFromMessage(message);

            expect(username).to.equal(message.user.name);
            done();
        });

        it("Get Telegram username from message", (done) => {
            const message = {
                user: {
                    id: "fake_id"
                },
                address: {
                    channelId: 'telegram'
                },
                sourceEvent: {
                    message: {
                        from: {
                            first_name: 'Fake',
                            last_name: 'User'
                        }
                    }
                }
            };
            const username = BotUtil.getContactNameFromMessage(message);

            expect(username).to.equal('Fake User');
            done();
        });

        it("Get Telegram username from message (when only first name available)", (done) => {
            const message = {
                user: {
                    id: "fake_id"
                },
                address: {
                    channelId: 'telegram'
                },
                sourceEvent: {
                    message: {
                        from: {
                            first_name: 'Fake'
                        }
                    }
                }
            };
            const username = BotUtil.getContactNameFromMessage(message);

            expect(username).to.equal('Fake');
            done();
        });

        it("Get Telegram username from message (when only last name available)", (done) => {
            const message = {
                user: {
                    id: "fake_id"
                },
                address: {
                    channelId: 'telegram'
                },
                sourceEvent: {
                    message: {
                        from: {
                            last_name: 'User'
                        }
                    }
                }
            };
            const username = BotUtil.getContactNameFromMessage(message);

            expect(username).to.equal('User');
            done();
        });

        it("Get Telegram username from message (when no name provided)", (done) => {
            const message = {
                user: {
                    id: "fake_id"
                },
                address: {
                    channelId: 'telegram'
                },
                sourceEvent: {
                    message: {
                        from: {
                        }
                    }
                }
            };
            const username = BotUtil.getContactNameFromMessage(message);

            expect(username).to.equal('');
            done();
        });
    });

    // describe("test for createContactFromMessage() method of botUtil", () => {
    //    it("test creating of Contact model from message", (done) => {
    //        const message = {
    //            user: {
    //                name: "fake_name",
    //                id: "fake_id"
    //            },
    //            address: {
    //                channelId: 'skype'
    //            }
    //        };
    //        const contact = BotUtil.createContactFromMessage(message);
    //
    //        expect(contact.userId).to.equal(message.user.id);
    //        expect(contact.name).to.equal(message.user.name);
    //        expect(contact.channel).to.equal(message.address.channelId);
    //        done();
    //    })
    // });

    describe("test for isCommand() method of botUtil", () => {
       it("test for checking of user response to be a command", (done) => {
           assert.equal(true, BotUtil.isCommand("schedule"));
           assert.equal(true, BotUtil.isCommand("abort"));
           assert.equal(true, BotUtil.isCommand("abortall"));
           assert.equal(true, BotUtil.isCommand("/repeat"));
           assert.equal(true, BotUtil.isCommand("repeat"));
           assert.equal(true, BotUtil.isCommand("blah blah blah repeat"));
           assert.equal(false, BotUtil.isCommand("blah blah blah repeat agaw"));
           assert.equal(false, BotUtil.isCommand("schadwdgule"));

           done();
       });
    });

    describe("test for parseCommand() method of botUtil", () => {
       it("test for parsing of user response to be a known command", (done) => {
           assert.equal("schedule", BotUtil.parseCommand("blah blah schedule"));
           assert.equal("schedule", BotUtil.parseCommand("schedule"));
           assert.equal("repeat", BotUtil.parseCommand("repeat"));
           assert.equal("abort", BotUtil.parseCommand("/abort"));
           assert.equal("abort", BotUtil.parseCommand("abort"));
           assert.equal("abortall", BotUtil.parseCommand("/abortall"));
           assert.equal("abortall", BotUtil.parseCommand("lol wtf abortall"));
           assert.equal(null, BotUtil.parseCommand("lol wtf abortall gaw"));
           assert.equal(null, BotUtil.parseCommand("lol wtf blah blah gaw"));

           done();
       })
    });
});