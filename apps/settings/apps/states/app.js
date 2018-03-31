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
		if ( err ) {
			req.log.debug( {
				app: 'settings/states',
				action: 'index',
				error: 'Error retrieving list of states'
			} );
		}
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
		req.log.debug( {
			app: 'settings/states',
			action: 'create',
			error: 'Slug was not provided',
			body: req.body
		} );
		req.flash( 'danger', 'state-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var state = {
		slug: req.body.slug,
		text: req.body.text,
		colour: req.body.colour,
		pastTense: req.body.pastTense,
		presentTense: req.body.presentTense
	};

	new States( state ).save( function( err, action ) {
		if ( err ) {
			req.log.error( {
				app: 'settings/states',
				action: 'create',
				error: err,
				body: req.body
			} );
		}
		req.flash( 'success', 'state-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	States.findOne( { slug: req.params.slug }, function( err, state ) {
		if ( err ) {
			req.log.error( {
				app: 'settings/states',
				action: 'edit',
				error: "Error looking up state " + err,
				body: req.body
			} );
		}
		if ( ! state ) {
			req.log.debug( {
				app: 'settings/states',
				action: 'edit',
				error: "State to update was not found"
			} );
			req.flash( 'warning', 'state-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: state.slug
		} );
		res.render( 'edit', { state: state } );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.log.debug( {
			app: 'settings/states',
			action: 'edit',
			error: "Slug was not provided",
			body: req.body
		} );
		req.flash( 'danger', 'state-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.text || req.body.text.trim() === '' ) {
		req.log.debug( {
			app: 'settings/states',
			action: 'edit',
			error: "State text was not provided",
			body: req.body
		} );
		req.flash( 'danger', 'state-text-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var state = {
		slug: req.body.slug,
		text: req.body.text,
		colour: req.body.colour,
		pastTense: req.body.pastTense,
		presentTense: req.body.presentTense
	};

	States.update( { slug: req.params.slug }, state, function( status ) {
		req.flash( 'success', 'state-updated' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
