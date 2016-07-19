"use strict";

var __config = __dirname + '/config/config.json';
var __static = __dirname + '/static';
var __src = __dirname + '/src';
var __apps = __dirname + '/apps';
var __views = __src + '/views';
var __js = __src + '/js';

var body = require( 'body-parser' ),
	config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	express = require( 'express' ),
	flash = require( 'express-flash' ),
	swig = require( 'swig' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	fs = require( 'fs' );

var Discourse = require( __js + '/discourse' );

var apps = [];

console.log( "Starting..." );

// Handle authentication
require( __js + '/authentication' ).auth( app );

// Setup static route
app.use( express.static( __static ) );

// Handle sessions
require( __js + '/sessions' )( app );

// Include support for notifications
app.use( flash() );
app.use( require( __js + '/quickflash' ) );

// Load apps
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
apps.sort( function( a, b ) {
	return a.priority < b.priority;
} );

// Load in local variables such as config.globals
app.use( require( __js + '/template-locals' )( config, apps ) );

// Use SWIG to render pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __views );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false );
swig.setDefaults( { cache: false } );

// Route apps
for ( var a in apps ) {
	var _app = apps[a];
	console.log( "	Route: /" + _app.path );
	app.use( '/' + _app.path, require( _app.app )( _app ) );
}

// Error 404
app.get( '*', function( req, res ) {
	res.status( 404 );
	res.render( '404' );
} );
console.log( "	Route: *" );

// Start server
var listener = app.listen( config.port ,config.host, function () {
	console.log( "Server started on: " + listener.address().address + ':' + listener.address().port );
} );

// Do regular Discourse group checks
setTimeout( Discourse.checkGroups, 2500 ); // Now and...
setInterval( Discourse.checkGroups, 3600000*24 ); // ...every day
