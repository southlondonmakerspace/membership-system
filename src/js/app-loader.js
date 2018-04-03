var __root = __dirname + '/../..';
var __config = __root + '/config/config.json';
var __apps = __root + '/apps';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config );

var log = require( __js + '/logging' ).log;

var fs = require( 'fs' );
	helmet = require( 'helmet' );

var app;
var apps = [];

module.exports = function( a ) {
	// Grab the express app reference locally
	app = a;

	// Loop through main app director contents
	loadApps();

	// Load template locals;
	app.use( require( __js + '/template-locals' )( apps ) );

	// Route apps
	routeApps();

	// Error 404
	app.use( function ( req, res, next ) {
		res.status( 404 );
		res.render( '404' );
	} );

	// Error 500
	app.use( function ( err, req, res, next ) {
		res.status( 500 );
		res.render( '500', { error: ( config.dev ? err.stack : undefined ) } );
	} );
};

function loadApps() {
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
				if ( ! output.priority ) output.priority = 100;
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
								if ( ! subapp_output.priority ) subapp_output.priority = 100;
								subapp_output.app = subapp + '/app.js';

								output.subapps.push( subapp_output );
							}
						}
					}
				}

				output.subapps.sort( sortPriority );

				apps.push( output );
			}
		}
	}

	apps.sort( sortPriority );
}

function sortPriority( a, b ) {
	return b.priority - a.priority;
}

function routeApps() {
	for ( var a in apps ) {
		var _app = apps[a];
		log.debug( {
			app: 'app-loader',
			action: 'load-app',
			path: '/' + _app.path
		} );
		var new_app = require( _app.app )( _app );
		new_app.locals.basedir = __root;
		new_app.use( helmet() );
		app.use( '/' + _app.path, new_app );

		if ( _app.subapps.length > 0 ) {
			for ( var s in _app.subapps ) {
				var _sapp = _app.subapps[s];
				log.debug( {
					app: 'app-loader',
					action: 'load-app',
					path: '/' + _app.path + '/' + _sapp.path
				} );

				var new_sub_app = require( _sapp.app )( _sapp );
				new_sub_app.locals.basedir = __root;
				new_sub_app.use( helmet() );
				new_app.use( '/' + _sapp.path, new_sub_app );
			}
		}
	}
}
