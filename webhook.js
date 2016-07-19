"use strict";

var __config = __dirname + '/config/config.json';
var __static = __dirname + '/static';
var __src = __dirname + '/src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	bodyParser = require( 'body-parser' ),
	textBodyParser = bodyParser.text( { type: 'application/json' } ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless ),
	Discourse = require( __js + '/discourse' );

var Members = require( __js + '/database' ).Members;
var Payments = require( __js + '/database' ).Payments;

console.log( "Starting..." );

app.post( '/', textBodyParser, function( req, res ) {
	if ( req.headers['webhook-signature'] != undefined && req.headers['content-type'] == 'application/json' ) {
		GoCardless.validateWebhook( req.headers['webhook-signature'], req.body, function( valid ) {
			if ( valid ) {
				var events = JSON.parse( req.body ).events;

				for ( var e in events ) {
					handleResourceEvent( events[e] );
				}

				res.sendStatus( 200 );
			} else {
				res.sendStatus( 498 );
			}
		} );
	} else {
		res.sendStatus( 498 );
	}
} );

// Start server
var listener = app.listen( config.gocardless.port ,config.host, function () {
	console.log( "Server started on: " + listener.address().address + ':' + listener.address().port );
} );

function handleResourceEvent( event ) {
	if ( event.resource_type == 'payments' ) {
		switch( event.action ) {
			case 'created': // Pending
				createPayment( event );
				break;
			case 'confirmed': // Collected
				updateDiscourse( event );
				extendMembership( event );
			case 'submitted': // Processing
			case 'cancelled': // Cancelled
			case 'failed': // Failed
			case 'paid_out': // Received
				updatePayment( event );
				break;
			default:
				console.log( 'Unknown event: ' );
				console.log( event );
		}
	}
}

function createPayment( event ) {
	var payment = {
		payment_id: event.links.payment,
		created: new Date( event.created_at ),
		status: event.details.cause
	}

	if ( event.links.subscription != undefined ) {
		payment.subscription_id = event.links.subscription;
		payment.description = 'Membership';

		Members.findOne( { 'gocardless.subscription_id': payment.subscription_id }, function( err, member ) {
			if ( member != undefined ) {
				payment.member = member._id;
			}
			new Payments( payment ).save( function( err ) {
				if ( err ) console.log( err );
			} );
		} );
	} else {
		new Payments( payment ).save( function( err ) {
			console.log( "Unlinked payment" );
		} );
	}
}

function updatePayment( event ) {
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( payment == undefined ) return; // There's nothing left to do here.
		payment.status = event.details.cause;
		payment.save( function( err ) {
			if ( err ) console.log( err );
		} );
	} );
}

function updateDiscourse( event ) {
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( payment == undefined ) return; // There's nothing left to do here.
		if ( payment.member != undefined ) {
			Discourse.grantMember( { _id: payment.member } );
		}
	} );
}

function extendMembership( event ) {
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( payment == undefined ) return; // There's nothing left to do here.
		if ( payment.member != undefined ) {
			Members.findOne( { _id: payment.member } ).populate( 'permissions.permission' ).exec( function( err, member ) {
				for ( var p = 0; p < member.permissions.length; p++ ) {
					console.log( member.permissions[p].permission.slug == 'member' );
				}
			} );
		}
	} );
}
