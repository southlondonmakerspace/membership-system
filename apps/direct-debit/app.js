"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Members = require( '../../src/js/database' ).Members;

var crypto = require( 'crypto' );

var auth = require( '../../src/js/authentication.js' );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Direct Debit",
		url: "/direct-debit"
	} );
	res.locals.activeApp = 'direct-debit';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'index' );
} );

module.exports = app;