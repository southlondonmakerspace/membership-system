var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var APIKeys = require( __js + '/database' ).APIKeys;

var auth = require( __js + '/authentication' );

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
	APIKeys.find( function( err, keys ) {
		res.render( 'index', { keys: keys } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create' );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'apikey-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.key || req.body.key.trim() === '' ) {
		req.flash( 'danger', 'apikey-key-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var key = {
		name: req.body.name,
		key: req.body.key
	};

	new APIKeys( key ).save( function( err ) {
		req.flash( 'success', 'apikey-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:id/edit', auth.isSuperAdmin, function( req, res ) {
	APIKeys.findById( req.params.id, function( err, key ) {
		if ( ! key ) {
			req.flash( 'warning', 'apikey-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: key.name
		} );
		res.render( 'edit', { key: key } );
	} );
} );

app.post( '/:id/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'apikey-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.key || req.body.key.trim() === '' ) {
		req.flash( 'danger', 'apikey-key-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var apikey = {
		name: req.body.name,
		key: req.body.key
	};

	APIKeys.update( { _id: req.params.id }, apikey, function( status ) {
		req.flash( 'success', 'apikey-update' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.post( '/:id/delete', auth.isSuperAdmin, function( req, res ) {
	APIKeys.remove( { _id: req.params.id }, function( err ) {
		req.flash( 'success', 'apikey-delete' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
