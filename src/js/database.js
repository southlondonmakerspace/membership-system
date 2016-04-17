"use strict";

var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

exports.connect = function( url ) {
	mongoose.connect( url );
	var db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'connection error' ) );
}

var permissionsSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId() },
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
	description: {
		type: String,
	}
} );

var memberSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: function() { return new mongoose.Types.ObjectId() },
		required: true,
		unique: true
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
	password_hash: {
		type: String,
		required: true
	},
	password_salt: {
		type: String,
		required: true
	},
	password_reset_code: {
		type: String,
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
	tag: {
		type: String,
		validate: {
			validator: function ( v ) {
				if ( v == '' ) return true;
				return /[A-z0-9]{8}/.test( v );
			},
			message: '{VALUE} is not a valid tag ID'
		}
	},
	tag_hashed: {
		type: String,
		unique: true,
		required: false
	},
	joined: {
		type: Date,
		default: Date.now,
		required: true
	},
	discourse: {
		id: {
			type: String,
			unique: true
		},
		email: {
			type: String,
			unique: true
		},
		activated: {
			type: Boolean,
			default: false
		},
		activation_code: {
			type: String	
		},
			
	},
	gocardless: {
		id: {
			type: String,
			unique: true
		},
		amount: {
			type: Number
		},
		minimum: {
			type: Number
		},
		transactions: [ {
			date: {
				type: Date
			},
			description: {
				type: String
			},
			bill_id: {
				type: String
			},
			subscription_id: {
				type: String
			},
			amount: {
				type: Number
			},
			status: {
				type: String
			}
		} ]
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
	} ]
} );

memberSchema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

exports.permissionsSchema = permissionsSchema;
exports.memberSchema = memberSchema;

exports.Permissions = mongoose.model( 'Permissions', exports.permissionsSchema );
exports.Members = mongoose.model( 'Members', exports.memberSchema );