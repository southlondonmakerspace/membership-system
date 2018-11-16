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
		referee: {
			type: ObjectId,
			ref: 'Members',
			required: true
		},
		referrerGift: String,
		referrerGiftOptions: Object,
		refereeGift: String,
		refereeGiftOptions: Object,
		refereeAmount: {
			type: Number,
			required: true
		},
		exports: [ {
			export_id: {
				type: ObjectId,
				ref: 'Exports',
				required: true
			},
			status: {
				type: String,
				required: true
			}
		} ]
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
