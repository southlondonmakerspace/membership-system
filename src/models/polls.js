const mongoose = require( 'mongoose' );

module.exports = {
	name: 'Polls',
	schema: mongoose.Schema( {
		question: {
			type: String,
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
