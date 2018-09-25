const mongoose = require( 'mongoose' );

const joinFormFields = {
	amount: {
		type: Number,
		required: true
	},
	period: {
		type: String,
		enum: ['monthly', 'annually']
	},
	referralCode: String,
	referralGift: String,
	referralGiftOptions: [{
		key: String,
		value: String
	}]
};

module.exports = {
	name: 'JoinFlows',
	schema: mongoose.Schema( {
		date: {
			type: Date,
			required: true,
			default: Date.now
		},
		redirect_flow_id: {
			type: String,
			required: true
		},
		sessionToken: {
			type: String,
			required: true,
		},
		joinForm: joinFormFields
	} ),
	joinFormFields
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
