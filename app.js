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
app.use( function( req, res, next ) {
	var flash = req.flash(),
		flashes = [],
		types = Object.keys( flash );

	for ( var t in types ) {
		var key = types[ t ];
		var messages = flash[ key ];
		for ( var m in messages ) {
			var message = messages[ m ];
			flashes.push( {
				type: key == 'error' ? 'danger' : key,
				message: message
			} );
		}
	}
	res.locals.flashes = flashes;
	next();
} )

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
app.use( function( req, res, next ) {
	// Process which apps should be shown in menu
	res.locals.apps = [];
	if ( req.user ) {
		res.locals.loggedIn = true;
		for ( var a in apps ) {
			var app = apps[a];
			if ( app.permissions != undefined && app.permissions != [] ) {
				for ( var p in app.permissions ) {
					if ( req.user.quickPermissions.indexOf( app.permissions[p] ) != -1 ) {
						res.locals.apps.push( app );
						break;
					}
				}
			}
		}
	}

	// Delete login redirect URL if user navigates to anything other than the login page
	if ( req.originalUrl != '/login' )
		delete req.session.requestedUrl;
	
	// Load config + prepare breadcrumbs
	res.locals.config = config.globals;
	res.locals.breadcrumb = [];
	next();
} );

// Use SWIG to render pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __dirname + '/src/views' );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false ); // Disables cache
swig.setDefaults( { cache: false } ); // Disables cache

// Route top level app
app.use( '/', require( __dirname + '/src/js/routes' ) );
console.log( "	Route: /" );

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