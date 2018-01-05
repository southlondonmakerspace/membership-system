var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Inductions',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true,
			unique: true
		},
		name: {
			type: String,
			required: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true
		},
		description: String,
		inductors: [ {
			type: ObjectId,
			ref: 'Members',
		} ],
		default: {
			duration: Number,
			type: {
				type: String
			},
			places: Number,
			booking_window: Number,
			cancellation_window: Number
		},
		permissions: {
			required: [ {
				type: ObjectId,
				ref: 'Permissions',
			} ],
			granted: [ {
				type: ObjectId,
				ref: 'Permissions',
			} ]
		},
		waiting_list: [
			{
				member: {
					type: ObjectId,
					ref: 'Members',
				},
				joined: Date,
				num_offers: Number,
				last_offer: Date
			}
		],
		dates: [
			{
				uuid: {
					type: String,
					unique: true,
					default: function () { // pseudo uuid4
						function s4() {
							return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
						}
						return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
					}
				},
				when: Date,
				duration: Number,
				type: String,
				places: Number,
				booking_window: Number,
				cancellation_window: Number,
				bookings: [ {
					type: ObjectId,
					ref: 'Members',
				} ]
			}
		]
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
