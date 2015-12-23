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
	}
} );

memberSchema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

exports.memberSchema = memberSchema;

exports.Members = mongoose.model( 'Members', exports.memberSchema );