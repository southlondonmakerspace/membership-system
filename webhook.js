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
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

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
	switch ( event.resource_type ) {
		case 'payments':
			console.log( 'payment' );
			handlePaymentEvent( event );
			break;
	}
}

function handlePaymentEvent( event ) {
	switch( event.action ) {
		case 'created': // Pending
			handlePaymentCreatedEvent( event );
			break;
		case 'submitted': // Processing
			console.log( 'submitted' );
			break;
		case 'confirmed': // Collected
			console.log( 'confirmed' );
			break;
		case 'cancelled': // Cancelled
			console.log( 'cancelled' );
			break;
		case 'failed': // Failed
			console.log( 'failed' );
			break;
		case 'paid_out': // Received
			console.log( 'paid_out' );
			break;
		default:
	}
	console.log( event );
}

function handlePaymentCreatedEvent( event ) {
	var payment = {
		payment_id: event.links.payment,
		created: new Date( event.created_at ),
		status: event.details.cause
	}

	if ( event.links.subscription != undefined ) {
		payment.subscription_id = event.links.subscription;
		payment.description = 'Membership';

		Members.findOne( { 'discourse.subscription_id': payment.subscription }, function( err, member ) {
			if ( member != undefined ) {
				payment.member = member._id;
			}
			new Payments( payment ).save( function( err ) {
				console.log( err );
			} );
		} );
	} else {
		new Payments( payment ).save( function( err ) {
			console.log( "Unlinked payment" );
		} );
	}
}


// _id
// payment_id
// subscription_id
// member
// status
// description
// amount
// created
// updated

// PAYMENT : CREATED
// { id: 'EV00068K3DNV8D',
//   created_at: '2016-05-26T04:33:45.917Z',
//   resource_type: 'payments',
//   action: 'created',
//   links: { subscription: 'SB00002TZ8MJQ6', payment: 'PM0001BSY770WF' },
//   details:
//    { origin: 'gocardless',
//      cause: 'payment_created',
//      description: 'Payment created by a subscription' },
//   metadata: {} }

// PAYMENT : SUBMITTED
// {
//   "id": "EV0006A00YKMK9",
//   "created_at": "2016-05-27T15:05:57.194Z",
//   "resource_type": "payments",
//   "action": "submitted",
//   "links": {
//     "payment": "PM0001BSY770WF"
//   },
//   "details": {
//     "origin": "gocardless",
//     "cause": "payment_submitted",
//     "description": "Payment submitted to the banks. As a result, it can no longer be cancelled."
//   },
//   "metadata": {}
// }

// PAYMENT : CONFIRMED
// {
//   "id": "EV0006GQXZC2PD",
//   "created_at": "2016-06-02T10:06:37.970Z",
//   "resource_type": "payments",
//   "action": "confirmed",
//   "links": {
//     "payment": "PM0001BSY770WF"
//   },
//   "details": {
//     "origin": "gocardless",
//     "cause": "payment_confirmed",
//     "description": "Enough time has passed since the payment was submitted for the banks to return an error, so this payment is now confirmed."
//   },
//   "metadata": {}
// }
