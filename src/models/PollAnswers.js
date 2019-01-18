const mongoose = require( 'mongoose' );

const ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'PollAnswers',
	schema: mongoose.Schema( {
		poll: {
			type: ObjectId,
			ref: 'Polls'
		},
		answer: {
			type: String,
			required: true
		},
		member: {
			type: ObjectId,
			ref: 'Members',
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
