"use strict";

var	express = require( 'express' ),
	app = express();

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	res.render( 'index', { transactions: req.user.gocardless.transactions } );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};