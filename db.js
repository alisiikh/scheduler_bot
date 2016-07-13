'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appCfg = require('./config');

mongoose.connect(appCfg.databaseURL);

module.exports.SkypeAddress = mongoose.model('SkypeAddress', new Schema({ 
		skypeId: { 
			type: String, 
			index: { unique: true } 
		},
		displayName: String,
		dateCreated: Date 
	}));
