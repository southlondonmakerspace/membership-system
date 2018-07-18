var mongoose = require( 'mongoose' );

module.exports = {
	name: 'JoinFlows',
	schema: mongoose.Schema( {
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

module.exports.schema.virtual( 'actualAmount' ).get( function () {
	return this.amount * ( this.period === 'annually'  ? 12 : 1 );
} );

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
