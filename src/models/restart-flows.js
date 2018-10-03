const mongoose = require( 'mongoose' );

const { joinFormFields } = require('./join-flows');

module.exports = {
	name: 'RestartFlows',
	schema: mongoose.Schema( {
		code: {
			type: String,
			required: true
		},
		member: {
			type: mongoose.Schema.ObjectId,
			ref: 'Members',
			required: true
		},
		date: {
			type: Date,
			required: true,
			default: Date.now
		},
		customerId: {
			type: String,
			required: true
		},
		mandateId: {
			type: String,
			required: true
		},
		joinForm: joinFormFields
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
