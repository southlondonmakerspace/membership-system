global.__root = __dirname;
global.__apps = __root + '/apps';
global.__config = __root + '/config/config.json';
global.__js = __root + '/src/js';
global.__models = __root + '/src/models';

var log = require( __js + '/logging' ).log;
log.info( {
	app: 'main',
	action: 'start'
} );

var config = require( __config );

if ( !config.gocardless.sandbox && config.dev ){
	log.error({
		app: 'main',
		error: 'Dev mode enabled but GoCardless is not in sandbox, refusing to start'
	});
	process.exit(1);
}

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
app.use( '/static', express.static( __root + '/static' ) );

// Handle sessions
require( __js + '/sessions' )( app );

// Include support for notifications
app.use( flash() );
app.use( require( __js + '/quickflash' ) );

// Use PUG to render pages
app.set( 'views', __root + '/src/views' );
app.set( 'view engine', 'pug' );
app.set( 'view cache', false );

// Load apps
app_loader( app );

// Start server
var server = app.listen( config.port ,config.host, function () {
	log.debug( {
		app: 'main',
		action: 'start-webserver',
		message: 'Started',
		address: server.address()
	} );
} );

process.on('SIGTERM', () => {
	log.debug( {
		app: 'main',
		action: 'stop-webserver',
		message: 'Waiting for server to shutdown'
	} );

	setTimeout(() => {
		log.debug( {
			app: 'main',
			action: 'stop-webserver',
			message: 'Server was forced to shutdown after timeout'
		} );
		process.exit(1);
	}, 20000).unref();

	server.close(() => {
		log.debug( {
			app: 'main',
			action: 'stop-webserver',
			message: 'Server successfully shutdown'
		} );
		process.exit();
	});
});
