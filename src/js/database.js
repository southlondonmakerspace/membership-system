"use strict";

var mongoose = require( 'mongoose' );

exports.connect = function( url ) {
	mongoose.connect( url );
	var db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'connection error' ) );
}

var memberSchema = mongoose.Schema( {
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
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
		validate: {
			validator: function ( v ) {
				return /[A-z0-9]{8}/.test( v );
			},
			message: '{VALUE} is not a valid tag ID'
		}
	},
	transactions: {
		type: Array
	},
	permissions: {
		type: Array

		/* 
			Containing an array of objects:
				permission: ObjectId of permission from a permissions table.
					name: name of permission
					slug: system name for API
					description: Short explanation about tweet, text only
				date_added: Date the permission was granted
				date_updated: Date the permission was last update/renewed
				date_expires: (optional) Date the permission will expire
		*/
	}
} );

memberSchema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

exports.memberSchema = memberSchema;

exports.Members = mongoose.model( 'Members', exports.memberSchema );