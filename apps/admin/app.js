"use strict";

var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();
	
var auth = require( '../../src/js/authentication.js' );

var config = require( '../../config/config.json' );

var apps = [];
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

function loadApps() {
	var files = fs.readdirSync( __apps );
	for ( var f in files ) {
		var file = __apps + '/' + files[f];
		if ( fs.statSync( file ).isDirectory() ) {
			var config_file = file + '/config.json';
			if ( fs.existsSync( config_file ) ) {
				var output = JSON.parse( fs.readFileSync( config_file ) );
				output.uid = files[f];
				if ( output.priority == undefined )
					output.priority = 100;
				output.app = file + '/app.js';
				apps.push( output );
			}
		}
	}

	for ( var a in apps ) {
		var _app = apps[a];
		console.log( "	  Sub route: /" + _app.path );
		app.use( '/' + _app.path, require( _app.app )( _app ) );
	}
}

module.exports = function( config ) {
	app_config = config;
	loadApps();
	return app;
};