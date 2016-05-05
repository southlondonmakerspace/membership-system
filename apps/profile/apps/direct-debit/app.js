"use strict";

var	express = require( 'express' ),
	app = express(),
	request = require( 'request' ),
	bodyParser = require( 'body-parser' ),
	textBodyParser = bodyParser.text( { type: 'application/json' } ),
	formBodyParser = bodyParser.urlencoded( { extended: true } );

var messages = require( '../../../../src/messages.json' );

var config = require( '../../../../config/config.json' );

var auth = require( '../../../../src/js/authentication.js' ),
	discourse = require( '../../../../src/js/discourse.js' ),
	Permissions = require( '../../../../src/js/database' ).Permissions,
	Members = require( '../../../../src/js/database' ).Members;

var GoCardless = require( '../../../../src/js/gocardless' )( config.gocardless );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	var hasMandate = false;
	var hasSubscription = false;

	if ( req.user.gocardless.mandate_id ) hasMandate = true;
	if ( req.user.gocardless.subscription_id ) hasSubscription = true;

	if ( req.query.redirect_flow_id ) {
		if ( req.user.gocardless.redirect_flow_id == req.query.redirect_flow_id ) {
			GoCardless.completeRedirectFlow( req.query.redirect_flow_id, req.user.gocardless.session_token, function( error, mandate_id, body ) {
				if ( error ) {
					req.flash( 'danger', messages['gocardless-mandate-err'] );
				} else {
					Members.update( { _id: req.user._id }, { $set: { "gocardless.mandate_id": mandate_id, "gocardless.redirect_flow_id": null } }, function ( err ) {} );
					req.flash( 'success', messages['gocardless-mandate-success'] );
				}
				res.redirect( app.parent.mountpath + app.mountpath );
			} );
			return;
		} else {
			req.flash( 'danger', messages['gocardless-mandate-err'] );
			res.redirect( app.parent.mountpath + app.mountpath );
		}
	}

	if ( ! hasMandate && ! hasSubscription ) {
		res.render( 'setup-mandate' );
	} else if ( hasMandate && ! hasSubscription ) {
		res.render( 'setup-subscription', {
			amount: ( req.user.gocardless.minimum ? req.user.gocardless.minimum : config.gocardless.minimum )
		} );
	} else if ( hasMandate && hasSubscription ) {
		res.render( 'complete' );
	}
} );

app.get( '/setup-mandate', auth.isLoggedIn, function( req, res ) {
	auth.generateActivationCode( function( session_token ) { 
		GoCardless.createRedirectFlow( 'Membership', session_token, config.audience + app.parent.mountpath + app.mountpath, function( error, redirect_url, body ) {
			if ( error ) {
				req.flash( 'danger', messages['gocardless-mandate-err'] );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				Members.update( { _id: req.user._id }, { $set: { "gocardless.session_token": session_token, "gocardless.redirect_flow_id": body.redirect_flows.id } }, function ( err ) {
					res.redirect( redirect_url );
				} );
			}
		} );
	} );
} );

app.get( '/cancel-mandate', auth.isLoggedIn, function( req, res ) {
	res.render( 'cancel-mandate' );
} );

app.post( '/cancel-mandate', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.mandate_id ) {
		GoCardless.cancelMandate( req.user.gocardless.mandate_id, function( error, status, body ) {
			if ( error ) {
				req.flash( 'danger', messages['gocardless-mandate-cancellation-err'] );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				if ( status ) {
					Members.update( { _id: req.user._id }, { $set: { 'gocardless.mandate_id': '' } }, function( err ) {
						req.flash( 'success', messages['gocardless-mandate-cancelled'] );
						res.redirect( app.parent.mountpath + app.mountpath );
					} );
				} else {
					req.flash( 'danger', messages['gocardless-mandate-cancellation-err'] );
					res.redirect( app.parent.mountpath + app.mountpath );
				}
			}
		} );
	} else {
		req.flash( 'danger', messages['gocardless-mandate-cancellation-err'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/create-subscription', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	var min = ( req.user.gocardless.minimum ? req.user.gocardless.minimum : config.gocardless.minimum );

	if ( req.body.amount < min ) {
		req.flash( 'danger', messages['gocardless-subscription-min'] + min );
		return res.redirect( app.parent.mountpath + app.mountpath );
	}

	var day_of_month = parseInt( req.body.day_of_month );

	if ( day_of_month.isNaN || day_of_month > 28 || day_of_month < -1 ) {
		req.flash( 'danger', messages['gocardless-subscription-invalid-day'] );
		return res.redirect( app.parent.mountpath + app.mountpath );
	}

	var meta = {
		uuid: req.user.uuid
	}

	GoCardless.createSubscription( req.user.gocardless.mandate_id, req.body.amount, req.body.day_of_month, 'Membership', meta, function( error, subscription_id, body ) {
		if ( error ) {
			req.flash( 'danger', messages['gocardless-subscription-err'] );
			res.redirect( app.parent.mountpath + app.mountpath );
		} else {
			Members.update( { _id: req.user._id }, { $set: { "gocardless.subscription_id": subscription_id } }, function ( err ) {
				req.flash( 'success', messages['gocardless-subscription-success'] );
				res.redirect( app.parent.mountpath + app.mountpath );
			} );
		}
	} );
} );

app.get( '/cancel-subscription', auth.isLoggedIn, function( req, res ) {
	res.render( 'cancel-subscription' );
} );

app.post( '/cancel-subscription', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.subscription_id ) {
		GoCardless.cancelSubscription( req.user.gocardless.subscription_id, function( error, status, body ) {
			if ( error ) {
				req.flash( 'danger', messages['gocardless-error'] );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				if ( status ) {
					Members.update( { _id: req.user._id }, { $set: { 'gocardless.subscription_id': '' } }, function( err ) {
						req.flash( 'success', messages['gocardless-subscription-cancelled'] );
						res.redirect( app.parent.mountpath + app.mountpath );
					} );
				} else {
					req.flash( 'danger', messages['gocardless-subscription-cancellation-err'] );
					res.redirect( app.parent.mountpath + app.mountpath );
				}
			}
		} );
	} else {
		req.flash( 'danger', messages['gocardless-subscription-cancellation-err'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/webhook', textBodyParser, function( req, res ) {
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

module.exports = function( config ) {
	app_config = config;
	return app;
};