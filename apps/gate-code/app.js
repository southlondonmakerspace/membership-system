var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var	Options = require( __js + '/options' )();

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'gate-code';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	res.render( 'index' );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
