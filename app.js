var __root = __dirname;
var __config = __root + '/config/config.json';
var __static = __root + '/static';
var __src = __root + '/src';
var __views = __src + '/views';
var __js = __src + '/js';

var log = require( __js + '/logging' ).log;
log.info( {
	app: 'main',
	action: 'start'
} );

var config = require( __config );

var database = require( __js + '/database' ).connect( config.mongo );

var express = require( 'express' ),
	helmet = require( 'helmet' ),
	flash = require( 'express-flash' ),
	app = express(),
	http = require( 'http' ).Server( app );

var Options = require( __js + '/options' )();
app.use( Options.load );

var app_loader = require( __js + '/app-loader' );

// Add logging capabilities
require( __js + '/logging' ).installMiddleware( app );

// Use helmet
app.use( helmet() );

// Handle authentication
require( __js + '/authentication' ).auth( app );

// Setup static route
app.use( express.static( __static ) );

// Handle sessions
require( __js + '/sessions' )( app );

// Include support for notifications
app.use( flash() );
app.use( require( __js + '/quickflash' ) );

// Use PUG to render pages
app.set( 'views', __views );
app.set( 'view engine', 'pug' );
app.set( 'view cache', false );

// Set reverse proxy trust (see http://expressjs.com/en/guide/behind-proxies.html)
// default to false
app.set( 'trust proxy', config.reverseProxyTrust || false )

// Load apps
app_loader( app );

// Start server
var listener = app.listen( config.port ,config.host, function () {
	log.debug( {
		app: 'main',
		action: 'start-webserver',
		message: 'Started',
		address: listener.address()
	} );
} );
