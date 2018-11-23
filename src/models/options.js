var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Options',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		key: {
			type: String,
			unique: true,
			required: true
		},
		value: {
			type: String,
			required: requiredButAllowEmptyString
		}
	} )
};

function requiredButAllowEmptyString() {
	return typeof this.value === 'string' ? false : true;
}

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
