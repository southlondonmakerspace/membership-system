"use strict";

var __root = '../..';
var __src = __root + '/src';

var	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var	passport = require( 'passport' );

var messages = require( __src + '/messages.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else {
		res.render( 'login' );
	}
} );

app.post( '/', formBodyParser, passport.authenticate( 'local', {
	failureRedirect: app.mountpath,
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

module.exports = function( config ) {
	app_config = config;
	return app;
};
