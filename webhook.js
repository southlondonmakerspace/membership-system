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
		case 'subscriptions':
			if ( event.action == 'payment_created' ) {
				console.log( 'subscription: payment created' );
				console.log( event );
			}
			break;
		case 'payments':
			console.log( 'payment' );
			handlePaymentEvent( event );
			break;
	}
}

function handlePaymentEvent( event ) {
	switch( event.action ) {
		case 'created': // Pending
			console.log( 'created' );
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
