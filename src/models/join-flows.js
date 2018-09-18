const mongoose = require( 'mongoose' );

const ObjectId = mongoose.Schema.ObjectId;

const joinFormFields = {
	amount: {
		type: Number,
		required: true
	},
	period: {
		type: String,
		enum: ['monthly', 'annually']
	},
	referrer: {
		type: ObjectId,
		ref: 'Members'
	},
	gift: String
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
