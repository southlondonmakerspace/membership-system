"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' );

var Members = require( './database' ).Members;

var config = require( '../../config/config.json' );

app.set( 'views', __dirname + '/../views' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( '/logout', function( req, res ) {
	req.logout();
	req.flash( 'success', 'Logged out' );
	res.redirect( '/' );
} );

app.post( '/auth/browserid', passport.authenticate( 'persona', {
	failureRedirect: '/login',
	successRedirect: '/migration',
	failureFlash: true,
	successFlash: true
} ) );

module.exports = app;