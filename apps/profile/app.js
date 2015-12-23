"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' );

app.set( 'views', __dirname + '/views' );

app.get( '/', ensureAuthenticated, function( req, res ) {
	res.render( 'index', { user: req.user } );
} );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() ) {
		return next();
	}
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}