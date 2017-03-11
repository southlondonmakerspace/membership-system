var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var apps = [];
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
