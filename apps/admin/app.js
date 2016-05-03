"use strict";

var	express = require( 'express' ),
	app = express();
	
var auth = require( '../../src/js/authentication.js' );

var config = require( '../../config/config.json' );

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

app.get( '/', auth.isAdmin, function( req, res ) {
	res.render( 'admin' );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};