const mongoose = require( 'mongoose' );

module.exports = {
	name: 'JTJStock',
	schema: mongoose.Schema( {
		design: {
			type: String,
			required: true,
			unique: true
		},
		stock: {
			type: Number,
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
