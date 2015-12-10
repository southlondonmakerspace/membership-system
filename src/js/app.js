var config = require( '../../config/config.json' );

var mongoose = require( 'mongoose' );

var	express = require( 'express' ),
	flash = require( 'express-flash' ),
	session = require( 'express-session' ),
	body = require('body-parser'),
	cookie = require('cookie-parser'),
	swig = require( 'swig' ),
	app = express(),
	http = require( 'http' ).Server( app );


// Setup static route
app.use( express.static( __dirname + '../../../static' ) );

// Enable support for form post data
app.use( body.json() );
app.use( body.urlencoded( { extended: true } ) );

// Add support for sessions
app.use( cookie() );
app.use( session( {
	secret: config.secret,
	cookie: { maxAge: 60000 },
	saveUninitialized: false,
	resave: false,
	rolling: true
} ) );

// Include support for notifications
app.use( flash() );

// Load in local variables such as config.globals
app.use( function( req, res, next ) {
	res.locals.config = config.globals;
	next();
} );

// Use SWIG to rener pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __dirname + './../views' );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false ); // Disables cache
swig.setDefaults( { cache: false } ); // Disables cache

// Generic routes
var routes = require( './routes' )( app );

// Start server
app.listen( config.port );