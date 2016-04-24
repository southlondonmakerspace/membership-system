"use strict";

var body = require( 'body-parser' ),
	config = require( __dirname + '/config/config.json' ),
	database = require( __dirname + '/src/js/database').connect( config.mongo ),
	express = require( 'express' ),
	flash = require( 'express-flash' ),
	swig = require( 'swig'),
	app = express(),
	http = require( 'http' ).Server( app ),
	fs = require( 'fs' );

var apps = [];

console.log( "Starting..." );

// Handle authentication
require( __dirname + '/src/js/authentication' )( app );

// Setup static route
app.use( express.static( __dirname + '/static' ) );

// Enable support for form post data
app.use( body.json() );
app.use( body.urlencoded( { extended: true } ) );

// Handle sessions
require( __dirname + '/src/js/sessions' )( app );

// Include support for notifications
app.use( flash() );
app.use( require( __dirname + '/src/js/quickflash' ) );

// Load apps
var files = fs.readdirSync( __dirname + '/apps' );
for ( var f in files ) {
	var file = __dirname + '/apps/' + files[f];
	if ( fs.statSync( file ).isDirectory() ) {
		var config_file = file + '/config.json';
		if ( fs.existsSync( config_file ) ) {
			var output = JSON.parse( fs.readFileSync( config_file ) );
			output.uid = files[f];
			output.app = file + '/app.js';
			apps.push( output );
		}
	}
}

// Load in local variables such as config.globals
app.use( require( __dirname + '/src/js/template-locals' )( config, apps ) );

// Use SWIG to render pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __dirname + '/src/views' );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false ); // Disables cache
swig.setDefaults( { cache: false } ); // Disables cache

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
var listener = app.listen( config.port, function () {
	console.log( "Server started on: " + listener.address().address + listener.address().port );
} );