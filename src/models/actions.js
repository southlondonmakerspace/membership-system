var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Actions',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true,
			unique: true
		},
		slug: {
			type: String,
			unique: true,
			required: true
		},
		text: String,
		eventFormat: String,
		startingState: {
			type: ObjectId,
			ref: 'States',
			required: true
		},
		endingState: {
			type: ObjectId,
			ref: 'States',
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
