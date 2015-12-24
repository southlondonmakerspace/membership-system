"use strict";

var mongoose = require( 'mongoose' );

exports.connect = function( url ) {
	mongoose.connect( url );
	var db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'connection error' ) );
}

var memberSchema = mongoose.Schema( {
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
		required: true
	},
	address: {
		type: String,
		required: true
	},
	tag_id: {
		type: String
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