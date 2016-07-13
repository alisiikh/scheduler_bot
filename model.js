'use strict';

const mongoose = require('mongoose');
const mongoUrl = require('./db').mongoUrl;
const Schema = mongoose.Schema;

mongoose.connect(mongoUrl);

const skypeAddressSchema = new Schema({ 
		skypeId: { type: String, index: { unique: true } },
		displayName: String,
		dateCreated: Date 
	});

module.exports.SkypeAddress = mongoose.model('SkypeAddress', skypeAddressSchema);