"use strict";

var passport = require( 'passport' );

module.exports = function( app ){

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

	app.get( '/account', ensureAuthenticated, function( req, res ) {
		res.render( 'account', { user: req.user } );
	} );

	app.post( '/auth/browserid', passport.authenticate( 'persona', {
		failureRedirect: '/login',
		successRedirect: '/account',
		failureFlash: true,
		successFlash: true
	} ) );

};

function ensureAuthenticated( req, res, next ) {

	if ( req.isAuthenticated() ) {
		return next();
	}
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}