var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'APIKeys',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		name: {
			type: String,
			required: true
		},
		key: {
			type: String,
			unique: true,
			required: true
		},
		capabilities: [
			{
				type: String
			}
		]
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
