var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId,
	crypto = require( 'crypto' );

exports.connect = function( url ) {
	mongoose.Promise = global.Promise;
	mongoose.connect( url, {
		useMongoClient: true
	} );
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
		iterations: {
			type: Number,
			default: 1000
		},
		reset_code: {
			type: String
		},
		tries: {
			type: Number,
			default: 0
		}
	},
	otp: {
		key: {
			type: String,
			default: ''
		},
		activated: {
			type: Boolean,
			default: false
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
			type: String
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
		},
		admin: {
			type: Boolean,
			default: false
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
memberSchema.virtual( 'can_admin' ).get( function() {
	var can_admin = [];
	this.permissions.forEach( function( permission, p ) {
		if ( permission.admin )
			can_admin.push( permission.permission.slug )
	} );
	return can_admin;
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
	successful: {
		type: Boolean,
		default: true
	},
	action: String
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

var optionsSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
	key: {
		type: String,
		unique: true,
		required: true
	},
	value: {
		type: String,
		required: true
	}
} );

var itemsSchema = mongoose.Schema( {
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
			unique: true // no duplicates!
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
} );

var actionsSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
	slug: {
		type: String,
		unique: true,
		required: true
	},
	text: String,
	eventFormat: String,
	startingState: {
		type: ObjectId,
		ref: 'States',
		required: true
	},
	endingState: {
		type: ObjectId,
		ref: 'States',
		required: true
	}
});

var statesSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
	},
	slug: {
		type: String,
		unique: true,
		required: true
	},
	text: String,
	colour: String
});

var enrollSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId(); },
		required: true,
		unique: true
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
} );

exports.permissionsSchema = permissionsSchema;
exports.memberSchema = memberSchema;
exports.paymentSchema = paymentSchema;
exports.historicEventsSchema = historicEventsSchema;
exports.eventsSchema = eventsSchema;
exports.apikeySchema = apikeySchema;
exports.optionsSchema = optionsSchema;
exports.itemsSchema = itemsSchema;
exports.actionsSchema = actionsSchema;
exports.statesSchema = statesSchema;
exports.enrollSchema = enrollSchema;

exports.Permissions = mongoose.model( 'Permissions', exports.permissionsSchema );
exports.Members = mongoose.model( 'Members', exports.memberSchema );
exports.Payments = mongoose.model( 'Payments', exports.paymentSchema );
exports.HistoricEvents = mongoose.model( 'HistoricEvents', exports.historicEventsSchema, 'HistoricEvent' );
exports.Events = mongoose.model( 'Events', exports.eventsSchema );
exports.APIKeys = mongoose.model( 'APIKeys', exports.apikeySchema );
exports.Options = mongoose.model( 'Options', exports.optionsSchema );
exports.Items = mongoose.model( 'Items', exports.itemsSchema );
exports.Actions = mongoose.model( 'Actions', exports.actionsSchema );
exports.States = mongoose.model( 'States', exports.statesSchema );
exports.Enroll = mongoose.model( 'Enroll', exports.enrollSchema );

exports.ObjectId = ObjectId;
exports.mongoose = mongoose;
