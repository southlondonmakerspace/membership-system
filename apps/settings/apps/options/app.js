var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var Options = require( __js + '/options' )();

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'settings';
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	Options.getAll( function( options ) {
		res.render( 'index', { options: options } );
	} );
} );

app.get( '/:key/edit', auth.isSuperAdmin, function( req, res ) {
	Options.get( req.params.key, function( option ) {
		if ( ! option ) {
			req.log.debug( {
				app: 'settings/options',
				action: 'edit',
				error: 'Option not found',
				option: req.params.key,
				sensitive: {
					body: req.body
				}
			} );
			req.flash( 'warning', 'option-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: option.key
		} );

		res.render( 'edit', { option: option } );
	} );
} );

app.post( '/:key/edit', auth.isSuperAdmin, function( req, res ) {
	Options.set( req.params.key, req.body.value, function( status ) {
		req.log.debug( {
			app: 'settings/options',
			action: 'edit',
			error: 'Option updated',
			option: req.params.key,
			value: req.body.value,
			sensitive: {
				body: req.body
			}
		} );
		req.flash( 'success', 'option-updated' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:key/reset', auth.isSuperAdmin, function( req, res ) {
	Options.get( req.params.key, function( option ) {
		if ( ! option ) {
			req.log.debug( {
				app: 'profile',
				action: 'reset',
				error: 'Option not found',
				sensitive: {
					body: req.body
				}
			} );
			req.flash( 'warning', 'option-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: option.key
		} );

		res.render( 'reset', { key: option.key } );
	} );
} );

app.post( '/:key/reset', auth.isSuperAdmin, function( req, res ) {
	Options.reset( req.params.key, function( status ) {
		req.log.debug( {
			app: 'settings/options',
			action: 'reset',
			error: 'Option was reset',
			option: req.params.key,
			sensitive: {
				body: req.body
			}
		} );
		req.flash( 'success', 'option-reset' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
