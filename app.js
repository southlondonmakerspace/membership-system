"use strict";

var body = require( 'body-parser' ),
	config = require( __dirname + '/config/config.json' ),
	database = require( __dirname + '/src/js/database'),
	express = require( 'express' ),
	flash = require( 'express-flash' ),
	swig = require( 'swig'),

	app = express(),
	http = require( 'http' ).Server( app );


// handle authentication
require( __dirname + '/src/js/authentication' )( app );

// Setup static route
app.use( express.static( __dirname + '/static' ) );

// Enable support for form post data
app.use( body.json() );
app.use( body.urlencoded( { extended: true } ) );

// handle sessions
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

// Load in local variables such as config.globals
app.use( function( req, res, next ) {
	res.locals.apps = config.apps;
	res.locals.config = config.globals;
	next();
} );

// Use SWIG to render pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __dirname + '/src/views' );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false ); // Disables cache
swig.setDefaults( { cache: false } ); // Disables cache

// Generic routes
require( __dirname + '/src/js/routes' )( app );

// Start server
app.listen( config.port );