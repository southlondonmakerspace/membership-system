var mongoose = require( 'mongoose' );

module.exports = {
	name: 'TransactionalEmails',
	schema: mongoose.Schema( {
		name: {
			type: String,
			required: true
		},
		recipients: {
			type: Array,
			required: true
		},
		created: {
			type: Date,
			required: true,
			default: Date.now
		},
		sent: Date
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
