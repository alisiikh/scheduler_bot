var mongoose = require('mongoose');
var mongoUrl = require('./db').mongoUrl;
var Schema = mongoose.Schema;

mongoose.connect(mongoUrl);

var skypeAddressSchema = new Schema({ 
		skypeId: String,
		displayName: String,
		dateCreated: Date 
	});

skypeAddressSchema.statics.findBySkypeId = function(skypeId, cb) {
	return this.find({ "skypeId": skypeId });
};

module.exports.SkypeAddress = mongoose.model('SkypeAddress', skypeAddressSchema);