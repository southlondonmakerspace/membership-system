var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var Options = require( __js + '/database' ).Options;

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

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
	Options.find( function( err, options ) {
		res.render( 'index', { options: options } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create' );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.key || req.body.key.trim() === '' ) {
		req.flash( 'danger', messages['options-key-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var option = {
		key: req.body.key,
		value: req.body.value
	};

	new Options( option ).save( function( err ) {
		req.flash( 'success', messages['options-created'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:key/edit', auth.isSuperAdmin, function( req, res ) {
	Options.findOne( { key: req.params.key }, function( err, option ) {
		if ( ! option ) {
			req.flash( 'warning', messages['options-404'] );
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
	if ( ! req.body.key || req.body.key.trim() === '' ) {
		req.flash( 'danger', messages['option-name-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var option = {
		key: req.body.key,
		value: req.body.value
	};

	Options.update( { key: req.params.key }, option, function( status ) {
		req.flash( 'success', messages['options-update'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
