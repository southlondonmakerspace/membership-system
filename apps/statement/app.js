"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	Members = require( __js + '/database' ).Members,
	Payments = require( __js + '/database' ).Payments;

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
	Payments.find( { member: req.user._id }, function( err, payments ) {
		res.render( 'index', { payments: payments } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
