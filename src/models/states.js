var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'States',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		slug: {
			type: String,
			unique: true,
			required: true
		},
		text: String,
		colour: String,
		pastTense: String,
		presentTense: String
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
