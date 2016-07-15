'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appCfg = require('./config');

mongoose.connect(appCfg.databaseURL);

module.exports.ContactModel = mongoose.model('ContactModel', new Schema({
		userId: {
			type: String, 
			index: { unique: true } 
		},
		name: String,
		dateCreated: Date 
	}));
