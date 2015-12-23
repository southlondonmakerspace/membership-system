"use strict";

var mongoose = require( 'mongoose' );

exports.connect = function( url ) {
	mongoose.connect( url );
	var db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'connection error' ) );
}

var memberSchema = mongoose.Schema( {
	firstname: {
		type: String
	},
	lastname: {
		type: String
	},
	uuid: {
		type: String ,
		default: function () { // pseudo uuid4
			function s4() {
				return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
			};
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		},
		unique: true
	},
	email: {
		type: String
	},
	address: {
		type: String
	}, // users physical address
	card_id: {
		type: String
	}, // the ID of the NFC card
	card_id_hashed: {
		type: String
	}, // the MD5 hash of the card id with salt
	disabled: {
		type: Boolean,
		default: false
	}, // for when the user wants to disable their account (self)
	approved: {
		type: Boolean,
		default: true
	}, // used for when an an administrator wishes to disable the account (admin)
	gc_subscription: {
		type: String
	}, // for when a GoCardless subscription has been set up
	gc_donation: {
		type: String
	}, // for when a GoCardless subscription has been set up
	last_payment: {
		type: Date
	}, // when the last payment was received
	membership_expires: {
		type: Date
	}, // when the last payment was received
	joined: {
		type: Date,
		default: function () { return new Date; }
	}, // when the account was created (not their first payment)
	last_accessed: {
		type: Date
	}, // when they last accessed the website
	last_entered: {
		type: Date
	}, // last recorded that they went in to the space
	last_updated: {
		type: Date
	} // last time any entry was updated
} );

memberSchema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

exports.memberSchema = memberSchema;

exports.Members = mongoose.model( 'Members', exports.memberSchema );