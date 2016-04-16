"use strict";

var	express = require( 'express' ),
	app = express();

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Statement",
		url: "/statement"
	} );
	res.locals.activeApp = 'statement';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	res.render( 'index', { transactions: req.user.gocardless.transactions } );
} );

module.exports = app;