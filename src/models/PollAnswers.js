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
		reason: String,
		shareable: Boolean,
		member: {
			type: ObjectId,
			ref: 'Members',
			required: true
		},
		exports: [ {
			export_id: {
				type: ObjectId,
				ref: 'Exports',
				required: true
			},
			status: {
				type: String,
				required: true
			}
		} ]
	}, {
		timestamps: true
	})
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
