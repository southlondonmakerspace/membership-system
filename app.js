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
	helmet = require( 'helmet' ),
	flash = require( 'express-flash' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	fs = require( 'fs' );

// Use helmet
app.use( helmet() );

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

// Loop through main app director contents
var files = fs.readdirSync( __apps );
for ( var f in files ) {

	// Only read directories
	var file = __apps + '/' + files[f];
	if ( fs.statSync( file ).isDirectory() ) {

		// Check for a config.json file
		var config_file = file + '/config.json';
		if ( fs.existsSync( config_file ) ) {

			// Parse the config into apps array
			var output = JSON.parse( fs.readFileSync( config_file ) );
			output.uid = files[f];
			if ( output.priority === undefined ) output.priority = 100;
			output.app = file + '/app.js';

			// Check for sub apps directory
			output.subapps = [];
			var subapp_path = file + '/apps';
			if ( fs.existsSync( subapp_path ) ) {
				// Fetch the contents of the subapp directory
				var subapps = fs.readdirSync( subapp_path );
				for ( var a in subapps ) {
					// Only read directories
					var subapp = subapp_path + '/' + subapps[a];
					if ( fs.statSync( subapp ).isDirectory() ) {
						// Check for a config.json file
						var sub_config_file = subapp + '/config.json';
						if ( fs.existsSync( sub_config_file ) ) {
							// Parse the config into apps array
							var subapp_output = JSON.parse( fs.readFileSync ( sub_config_file ) );
							subapp_output.uid = subapps[a];
							if ( subapp_output.priority === undefined ) subapp_output.priority = 100;
							subapp_output.app = subapp + '/app.js';
							output.subapps.push( subapp_output );
						}
					}
				}
			}
			output.subapps.sort( function( a, b ) {
				return a.priority < b.priority;
			} );
			apps.push( output );
		}
	}
}
apps.sort( function( a, b ) {
	return a.priority < b.priority;
} );

// Load in local variables such as config.globals
app.use( require( __js + '/template-locals' )( config, apps ) );

// Use PUG to render pages
app.set( 'views', __views );
app.set( 'view engine', 'pug' );
app.set( 'view cache', false );

// Route apps
for ( var a in apps ) {
	var _app = apps[a];
	console.log( "	Route: /" + _app.path );
	var new_app = require( _app.app )( _app );
	app.use( '/' + _app.path, new_app );
	if ( _app.subapps.length > 0 ) {
		for ( var s in _app.subapps ) {
			var _sapp = _app.subapps[s];
			console.log( "	       /" + _app.path + "/" + _sapp.path  );
			var new_sub_app = require( _sapp.app )( _sapp );
			new_app.use( '/' + _sapp.path, new_sub_app );
		}
	}
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
