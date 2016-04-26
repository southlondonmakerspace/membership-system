	"use strict";

var	express = require( 'express' ),
	app = express(),
	request= require( 'request' );

var config = require( '../../config/config.json' );

var discourse = require( '../../src/js/discourse.js' ),
	Members = require( '../../src/js/database' ).Members;

var auth = require( '../../src/js/authentication.js' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: 'Profile',
		url: '/profile'
	} );
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	// Not linked or in activation
	if ( ! req.user.discourse.activated && ! req.user.discourse.activation_code ) {
		discourse.getUserByEmail( req.user.email, function( user ) {
			if ( user != undefined ) {
				Members.update( { "_id": req.user._id }, { $set: {
					"discourse.id": user.id,
					"discourse.email": req.user.email
				} }, function( err ) {
				} );
				user.avatar = config.discourse.url + user.avatar_template.replace( '{size}', 100 );
			}
			res.render( 'find', { discourse_user: user } );
		} );
	// Linked, not activated
	} else if ( ! req.user.discourse.activated ) {
		res.render( 'activate', { activation_code: req.query.code } );

	// Linked 
	} else if ( req.user.discourse.activated ) {
		discourse.getUserByEmail( req.user.discourse.email, function( user ) {
			user.avatar = config.discourse.url + user.avatar_template.replace( '{size}', 100 );
			res.render( 'linked', { discourse_user: user } );
		} );
	}
} );

app.post( '/link', auth.isLoggedIn, function( req, res ) {
	if ( ! req.user.discourse.activation_code ) {
		auth.generateActivationCode( function( code ) {
			code = code.toString( 'hex' );
			
			Members.update( { "_id": req.user._id }, { $set: {
				"discourse.activation_code": code
			} }, function ( error ) {} );

			discourse.getUserByEmail( req.user.discourse.email, function( user ) {
				discourse.sendActivationMessage( user.username, code );
			} );
			
			req.flash( 'info', 'Activation code sent to your Discourse private messages' );
		} );
	} else {
		req.flash( 'warning', 'Activation code has already been sent' );
	}
	res.redirect( app.mountpath );
} );

app.post( '/activate', auth.isLoggedIn, function( req, res ) {
	if ( req.body.activation_code != '' ) {
		if ( req.body.activation_code == req.user.discourse.activation_code ) {
			Members.update( { "_id": req.user._id }, { $set: {
				"discourse.activated": true,
				"discourse.activation_code": null
			} }, function ( error ) {} );
			req.flash( 'info', 'Discourse user linked' );
			return res.redirect( app.mountpath );
		}
	}
	req.flash( 'warning', 'You must enter a valid activation code' );
	res.redirect( app.mountpath );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};