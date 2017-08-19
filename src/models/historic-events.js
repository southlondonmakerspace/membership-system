var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'HistoricEvents',
	schema: mongoose.Schema( {
		uuid: String,
		description: String,
		created: Date,
		type: String,
		renumeration: Number
	} )
};
module.exports.model = mongoose.model( module.exports.name, module.exports.schema, 'HistoricEvent' );
