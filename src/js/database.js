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
		default: new mongoose.Types.ObjectId(),
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

var legacySchema = mongoose.Schema( {
	email: String,
	name: String,
	address: String,
	card_id: String,
	migrated: {
		type: Boolean,
		default: false
	}
} );

var memberSchema = mongoose.Schema( {
	_id: {
		type: ObjectId,
		default: new mongoose.Types.ObjectId(),
		required: true,
		unique: true
	},
	username: {
		type: String,
		required: true,
		unique: true
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
	address: {
		type: String,
		required: true
	},
	tag_id: {
		type: String,
		unique: true,
		required: false,
		validate: {
			validator: function ( v ) {
				if ( v == '' ) return true;
				return /[A-z0-9]{8}/.test( v );
			},
			message: '{VALUE} is not a valid tag ID'
		}
	},
	transactions: {
		type: Array
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
exports.legacySchema = legacySchema;
exports.memberSchema = memberSchema;

exports.Permissions = mongoose.model( 'Permissions', exports.permissionsSchema );
exports.LegacyMembers = mongoose.model( 'LegacyMembers', exports.legacySchema );
exports.Members = mongoose.model( 'Members', exports.memberSchema );