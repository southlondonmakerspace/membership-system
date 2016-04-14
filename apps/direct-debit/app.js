"use strict";

var	express = require( 'express' ),
	app = express();

var config = require( '../../config/config.json' );

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

var gocardless = require( 'gocardless' )( config.gocardless );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Direct Debit",
		url: "/direct-debit"
	} );
	res.locals.activeApp = 'direct-debit';
	next();
} );

app.post( '/setup', auth.isLoggedIn, function( req, res ) {
	if ( req.body.amount < ( req.user.gocardless.minimum ? req.user.gocardless.minimum : config.gocardless.minimum ) ) {
		req.flash( 'danger', 'Minimum direct debit amount is £' + config.gocardless.minimum );
		return res.redirect( '/direct-debit' );
	}

	var url = gocardless.subscription.newUrl( {
		amount: req.body.amount,
		interval_unit: 'month',
		interval_length: '1',
		name: 'Membership',
		user: {
			first_name: req.user.firstname,
			last_name: req.user.lastname,
			email: req.user.email,
			"billing_address1": "TEST",
			"billing_town": "London",
			"billing_postcode": "E8 4DQ"
		}
	} );

	Members.update( { _id: req.user._id }, { $set: { "gocardless.amount": req.body.amount } }, function ( err ) {
		res.redirect( url );
	} );
} );

app.get( '/confirm', auth.isLoggedIn, function( req, res ) {
	gocardless.confirmResource( req.query, function( err, request, body ) {
		if ( err ) return res.end( 401, err );
		Members.update( { _id: req.user._id }, { $set: { "gocardless.id": req.query.resource_id } }, function ( err ) {
			req.flash( 'success', 'Direct Debit setup succesfully' );
			res.redirect( '/direct-debit' );
		} );
	} );
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'index', {
		gocardless: req.user.gocardless,
		amount: ( req.user.gocardless.minimum ? req.user.gocardless.minimum : config.gocardless.minimum )
	} );
} );

app.get( '/cancel', auth.isLoggedIn, function( req, res ) {
	res.render( 'cancel' );
} );

app.post( '/cancel', auth.isLoggedIn, function( req, res ) {
	gocardless.subscription.cancel( {
		id: req.user.gocardless.id
	}, function( err,response, body ) {
		var response = JSON.parse( body );

		if ( response.status == 'cancelled' ) {
			Members.update( { _id: req.user._id }, { $set: { gocardless: { id: '', amount: '' } } }, function( err ) {
				req.flash( 'success', 'Direct debit cancelled' );
				res.redirect( '/direct-debit' );
			} );
		} else {
			req.flash( 'danger', 'Error cancelling direct debit' );
			res.redirect( '/direct-debit' );
		}
	} );
} );
} );

module.exports = app;