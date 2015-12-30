"use strict";

var body = require( 'body-parser' ),
	config = require( __dirname + '/config/config.json' ),
	database = require( __dirname + '/src/js/database').connect( config.mongo ),
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
	if ( req.user ) res.locals.loggedIn = true
	res.locals.apps = config.apps;
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

// Load top level app
app.use( '/', require( __dirname + '/src/js/routes' ) );

// Load apps
for ( var a in config.apps ) {
	app.use( '/' + config.apps[a].path, require( __dirname + '/apps/' + config.apps[a].path + '/app' ) );
}

// Error 404
app.get( '*', function( req, res ) {
	res.status( 404 );
	res.render( '404' );
} );

// Start server
app.listen( config.port );