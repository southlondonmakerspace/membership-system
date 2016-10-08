"use strict";

var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	Permissions = require( __js + '/database' ).Permissions,
	Members = require( __js + '/database' ).Members;

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
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		for ( var p = 0; p < permissions.length; p++ ) {
			var permission = permissions[p];
			if ( req.user.quickPermissions.indexOf( permission.slug ) != -1 )
				permission.granted = true;
		}
		res.render( 'permissions', { permissions: permissions } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
