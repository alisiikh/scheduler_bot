'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appCfg = require('./config');

mongoose.connect(appCfg.mongo.databaseURL);

module.exports.Contact = mongoose.model('Contact',
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
