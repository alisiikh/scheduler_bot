var mongoose = require('mongoose');
var mongoUrl = require('./db').mongoUrl;
var Schema = mongoose.Schema;

mongoose.connect(mongoUrl);

var skypeAddressSchema = new Schema({ 
		skypeId: { type: String, index: { unique: true } },
		displayName: String,
		dateCreated: Date 
	});

module.exports.SkypeAddress = mongoose.model('SkypeAddress', skypeAddressSchema);