var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Payments',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		payment_id: {
			type: String,
			required: true,
			unique: true
		},
		subscription_id: String,
		member: {
			type: ObjectId,
			ref: 'Members'
		},
		status: String,
		description: String,
		amount: Number,
		created: Date,
		charge_date: Date,
		updated: Date,
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
