"use strict";

var	express = require( 'express' ),
	app = express();

var	passport = require( 'passport' );

app.set( 'views', __dirname + '/views' );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are already logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'login' );
	}
} );

app.post( '/', passport.authenticate( 'local', {
	failureRedirect: '/login',
	successRedirect: '/profile',
	failureFlash: true,
	successFlash: true
} ) );

module.exports = app;