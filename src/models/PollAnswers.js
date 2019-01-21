const mongoose = require( 'mongoose' );

const ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'PollAnswers',
	schema: mongoose.Schema( {
		poll: {
			type: ObjectId,
			ref: 'Polls',
			required: true
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
	}, {
		timestamps: true
	})
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
