"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' );

app.set( 'views', __dirname + '/../views' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( '/login' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are already logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'login' );
	}
} );

app.post( '/login', passport.authenticate( 'persona', { failureRedirect: '/login' } ), function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are already logged in' );
		res.redirect( '/profile' );
	} else {
		res.redirect( '/migration' );
	}
} );

app.get( '/migration', ensureAuthenticated, function( req, res ) {
	// Needs to go off and access legacy document collection
	res.render( 'migrate', { legacy: req.user } );
} );

app.post( '/migration', ensureAuthenticated, function( req, res ) {
	// Needs to create new user and mark legacy document as migrated to prevent repeats
	req.flash( 'info', 'This is where migration would occur' );
	res.redirect( '/profile' );
} );

app.get( '/join' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'join' );
	}
} );

app.post( '/join', function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.redirect( '/' );
	}
} );

app.get( '/password-reset' , function( req, res ) {
	res.render( 'reset-password' );
} );

app.post( '/password-reset', function( req, res ) {
	res.redirect( '/' );
} );

app.get( '/logout', function( req, res ) {
	req.logout();
	req.flash( 'success', 'Logged out' );
	res.redirect( '/' );
} );

app.post( '/auth/browserid', passport.authenticate( 'persona', {
	failureRedirect: '/login',
	successRedirect: '/profile',
	failureFlash: true,
	successFlash: true
} ) );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() ) {
		return next();
	}

	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}