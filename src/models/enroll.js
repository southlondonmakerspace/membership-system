var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Enroll',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		code: {
			type: String,
			unique: true,
			required: true
		},
		tag: {
			type: String,
			unique: true,
			required: true
		},
		created: {
			type: Date,
			default: Date.now,
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
