'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appCfg = require('./config');

mongoose.connect(appCfg.mongo.databaseURL, { useNewUrlParser: true });

const Contact = mongoose.model('Contact',
	new Schema({
		userId: {
			type: String, 
			index: { unique: true } 
		},
		channel: String,
		name: String,
		dateCreated: Date 
	})
);

const User = mongoose.model('User',
	new Schema({
		contact: { type: Schema.Types.ObjectId, ref: 'Contact' }
	})
);

/*
 { userData: {
  contact:
      { _id: '5b95641314e83b60d8dd12d5',
        userId: 'default-user',
        name: 'User',
        channel: 'emulator',
        dateCreated: '2018-09-09T18:18:59.996Z',
        __v: 0 },
     command: 'schedule',
     interval: '5 seconds',
     content: 'one'
    },
  privateConversationData:
   { 'BotBuilder.Data.SessionState': { callstack: [], lastAccess: 1536522098866, version: 1.2 } },
  conversationData: {}
 }

 */

module.exports = {
	Contact
};