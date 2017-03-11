var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId,
	crypto = require( 'crypto' );

exports.connect = function( url ) {
	mongoose.connect( url );
	var db = mongoose.connection;
	db.on( 'connected', console.error.bind( console, 'Connected to Mongo database.' ) );
	db.on( 'error', console.error.bind( console, 'Error connecting to Mongo database.' ) );

	return exports;
};

var permissionsSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
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
	superadmin_only: Boolean,
	group: {
		id: String,
		name: String,
		order: Number
	},
	event_name: String,
	event_unauthorised: String
} );

var memberSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
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
	email: {
		type: String,
		required: true,
		unique: true,
		validate: {
			validator: function ( v ) {
				return /[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,}/.test( v );
			},
			message: '{VALUE} is not a valid email address'
		}
	},
	password: {
		hash: {
			type: String,
			required: true
		},
		salt: {
			type: String,
			required: true
		},
		reset_code: {
			type: String,
		},
		tries: {
			type: Number,
			default: 0
		}
	},
	activated: {
		type: Boolean,
		default: false
	},
	activation_code: {
		type: String,
	},
	firstname: {
		type: String,
		required: true
	},
	lastname: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	postcode_coordinates: {
		lat: Number,
		lng: Number
	},
	tag: {
		id: {
			type: String,
			validate: {
				validator: function ( v ) {
					if ( v === '' ) return true;
					return /[A-z0-9]{8}/.test( v );
				},
				message: '{VALUE} is not a valid tag ID'
			}
		},
		hashed: {
			type: String,
			required: false
		}
	},
	joined: {
		type: Date,
		default: Date.now,
		required: true
	},
	emergency_contact: {
		firstname: {
			type: String
		},
		lastname: {
			type: String
		},
		telephone: {
			type: String
		}
	},
	discourse: {
		email: String,
		username: String,
		activated: {
			type: Boolean,
			default: false
		},
		activation_code: String,

	},
	gocardless: {
		redirect_flow_id: {
			type: String
		},
		mandate_id: {
			type: String
		},
		subscription_id: {
			type: String
		},
		session_token: {
			type: String
		},
		minimum: {
			type: Number
		},
		next_possible_charge_date: {
			type: Date
		}
	},
	permissions: [ {
		permission: {
			type: ObjectId,
			ref: 'Permissions',
			required: true
		},
		date_added: {
			type: Date,
			default: Date.now,
			required: true
		},
		date_updated: {
			type: Date,
			default: Date.now,
			required: true
		},
		date_expires: {
			type: Date
		}
	} ],
	last_seen: Date
} );
memberSchema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );
memberSchema.virtual( 'gravatar' ).get( function() {
	var md5 = crypto.createHash( 'md5' ).update( this.email ).digest( 'hex' );
	return '//www.gravatar.com/avatar/' + md5;
} );

var paymentSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
	payment_id: {
		type: String,
		required: true,
		unique: true
	},
	subscription_id: String,
	member: {
		type: ObjectId,
		ref: 'Members'
	},
	status: String,
	description: String,
	amount: Number,
	created: Date,
	charge_date: Date,
	updated: Date,
} );

var historicEventsSchema = mongoose.Schema( {
	uuid: String,
	description: String,
	created: Date,
	type: String,
	renumeration: Number
} );

var eventsSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
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
	activity: {
		type: ObjectId,
		ref: 'Activities'
	},
	successful: {
		type: Boolean,
		default: true
	},
	action: String
} );

var activitySchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
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
	event_name: String,
	admin_only: {
		type: Boolean,
		default: false
	}
} );

var apikeySchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
	name: {
		type: String,
		required: true
	},
	key: {
		type: String,
		unique: true,
		required: true
	}
} );

exports.permissionsSchema = permissionsSchema;
exports.memberSchema = memberSchema;
exports.paymentSchema = paymentSchema;
exports.historicEventsSchema = historicEventsSchema;
exports.eventsSchema = eventsSchema;
exports.activitySchema = activitySchema;
exports.apikeySchema = apikeySchema;

exports.Permissions = mongoose.model( 'Permissions', exports.permissionsSchema );
exports.Members = mongoose.model( 'Members', exports.memberSchema );
exports.Payments = mongoose.model( 'Payments', exports.paymentSchema );
exports.HistoricEvents = mongoose.model( 'HistoricEvents', exports.historicEventsSchema, 'HistoricEvent' );
exports.Events = mongoose.model( 'Events', exports.eventsSchema );
exports.Activities = mongoose.model( 'Activities', exports.activitySchema );
exports.APIKeys = mongoose.model( 'APIKeys', exports.apikeySchema );

exports.ObjectId = ObjectId;
exports.mongoose = mongoose;
