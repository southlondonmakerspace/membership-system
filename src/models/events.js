var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Events',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		happened: {
			type: Date,
			default: Date.now,
			required: true
		},
		member: {
			type: ObjectId,
			ref: 'Members'
		},
		permission: {
			type: ObjectId,
			ref: 'Permissions'
		},
		successful: {
			type: Boolean,
			default: true
		},
		item: {
			type: ObjectId,
			ref: 'Items'
		},
		state: {
			type: ObjectId,
			ref: 'States'
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
