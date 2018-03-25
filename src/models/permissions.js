var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Permissions',
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
		slug: {
			type: String,
			unique: true,
			required: true
		},
		description: String,
		group: {
			id: String,
			name: String,
			order: Number
		},
		event_name: String,
		event_unauthorised: String
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
