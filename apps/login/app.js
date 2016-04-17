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
	failureFlash: true,
	successFlash: true
} ), function (req, res ) {
	if ( req.session.requestedUrl != undefined ) {
		res.redirect( req.session.requestedUrl );
		delete req.session.requestedUrl;
	} else {
		res.redirect( '/profile' );
	}
} );

module.exports = app;