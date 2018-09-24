const mongoose = require( 'mongoose' );

const ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Referrals',
	schema: mongoose.Schema( {
		date: {
			type: Date,
			required: true,
			default: Date.now
		},
		referrer: {
			type: ObjectId,
			ref: 'Members',
			required: true
		},
		referree: {
			type: ObjectId,
			ref: 'Members',
			required: true
		},
		referrerGift: String,
		referreeGift: String
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
