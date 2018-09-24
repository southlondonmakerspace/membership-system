var mongoose = require( 'mongoose' );

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
		amount: {
			type: Number,
			required: true
		},
		period: {
			type: String,
			enum: ['monthly', 'annually']
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
