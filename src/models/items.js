var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Items',
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
		guide:  String,
		image: {
			large: String,
			icon: String
		},
		actions: [
			{
				type: ObjectId,
				ref: 'Actions',
				required: true,
				unique: true
			}
		],
		states: [
			{
				type: ObjectId,
				ref: 'States',
				required: true
			}
		],
		defaultState: {
			type: ObjectId,
			ref: 'States',
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
