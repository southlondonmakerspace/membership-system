var __root = __dirname + '/../..';
var __config = __root + '/config/config.json';
var __apps = __root + '/apps';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config );

var log = require( __js + '/logging' ).log;

var fs = require( 'fs' );
var helmet = require( 'helmet' );

module.exports = function( app ) {
	// Loop through main app directory contents
	var apps = loadApps( __apps, config.appOverrides );

	// Load template locals;
	app.use( require( __js + '/template-locals' )( apps ) );

	// Route apps
	routeApps(app, apps);

	// Error 404
	app.use( function ( req, res, next ) { // eslint-disable-line no-unused-vars
		res.status( 404 );
		res.render( '404' );
	} );

	// Error 500
	app.use( function ( err, req, res, next ) { // eslint-disable-line no-unused-vars
		res.status( 500 );
		res.render( '500', { error: ( config.dev ? err.stack : undefined ) } );
		req.log.error({
			error: err
		});
	} );
};

function loadApps( basePath, overrides ) {
	return fs.readdirSync( basePath )
		.filter( function ( file ) {
			var path = basePath + '/' + file;
			return fs.statSync( path ).isDirectory() && fs.existsSync( path + '/config.json' );
		} )
		.map( function ( file ) {
			return loadApp( file, basePath + '/' + file, overrides[file] );
		} )
		.filter( function ( app ) {
			return ! app.disabled;
		} )
		.sort( function ( a, b ) {
			return b.priority - a.priority;
		} );
}

function loadApp( uid, path, overrides ) {
	var appConfig = require( path + '/config.json' );
	overrides = overrides || { config: {}, subapps: {} };

	var subapps = fs.existsSync( path + '/apps' ) ?
		loadApps( path + '/apps', overrides.subapps ) : [];

	return Object.assign( {
		uid: uid,
		app: path + '/app.js',
		priority: 100,
		subapps: subapps
	}, appConfig, overrides.config );
}

function routeApps(mainApp, apps) {
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
		mainApp.use( '/' + _app.path, new_app );

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
