"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' );

app.set( 'views', __dirname + '/../views' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( '/login' , function( req, res ) {
	res.render( 'login' );
} );

app.post( '/login', passport.authenticate( 'persona', { failureRedirect: '/login' } ), function( req, res ) {
	res.redirect( '/' );
} );

app.get( '/join' , function( req, res ) {
	res.render( 'join' );
} );

app.post( '/join', passport.authenticate( 'persona', { failureRedirect: '/login' } ), function( req, res ) {
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