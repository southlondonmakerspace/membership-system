"use strict";

var mongoose = require( 'mongoose' );
var config = require( __dirname + '../../../config/config.json' );

module.exports = function() {
	mongoose.connect( config.mongo );
	
	var db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'connection error' ) );
	db.once( 'open', function callback () {
		var memberSchema = mongoose.Schema( {
			name: String,
			uuid: {
				type: String,
				default: function () { // pseudo uuid4
					function s4() {
						return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
					};
					return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
				}
			},
			email: String,
			address: { type: String }, // users physical address
			card_id: String, // the ID of the NFC card
			card_id_hashed: String, // the MD5 hash of the card id with salt
			disabled: { type: Boolean, default: false }, // for when the user wants to disable their account (self)
			approved: { type: Boolean,    default: true }, // used for when an an administrator wishes to disable the account (admin)
			gc_subscription: String, // for when a GoCardless subscription has been set up
			gc_donation: String, // for when a GoCardless subscription has been set up
			last_payment: { type: Date }, // when the last payment was received
			membership_expires: { type: Date }, // when the last payment was received
			joined: { type: Date,    default: function () { return new Date;} }, // when the account was created (not their first payment)
			last_accessed: { type: Date }, // when they last accessed the website
			last_entered: { type: Date }, // last recorded that they went in to the space
			last_updated: { type: Date }, // last time any entry was updated
			permission: { type: Number, default: 0 } // permission level. 0 is none, 50 is admin
		} );

		var Member = mongoose.model( 'Member', memberSchema );
	} );
}();