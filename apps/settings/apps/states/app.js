var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	States = db.States

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
	States.find( function( err, states ) {
		res.render( 'index', { states: states } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create' );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'state-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var state = {
		slug: req.body.slug,
		text: req.body.text,
		colour: req.body.colour,
	};

	new States( state ).save( function( err, action ) {
		req.flash( 'success', 'state-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	States.findOne( { slug: req.params.slug }, function( err, state ) {
		if ( ! state ) {
			req.flash( 'warning', 'state-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: action.slug
		} );
		res.render( 'edit', { state: state } );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'state-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'state-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var state = {
		slug: req.body.slug,
		text: req.body.text,
		colour: req.body.colour,
	};

	States.update( { slug: req.params.slug }, state, function( status ) {
		req.flash( 'success', 'state-update' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
