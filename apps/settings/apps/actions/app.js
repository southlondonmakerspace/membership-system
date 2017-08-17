var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Actions = db.Actions
	States = db.States

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
	Actions.find().populate('startingState').populate('endingState').exec( function( err, actions ) {
		res.render( 'index', { actions: actions } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	States.find( function (err, states)
	{
		res.render( 'create', { states: states, action: {} } );
	} );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'action-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var action = {
		slug: req.body.slug,
		text: req.body.actionText,
		startingState: req.body.startingState,
		endingState: req.body.endingState,
		eventFormat: req.body.eventFormat
	};
	console.log(action)
	new Actions( action ).save( function( err, action ) {
		req.flash( 'success', 'action-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Actions.findOne( { slug: req.params.slug }, function( err, action ) {
		if ( ! action ) {
			req.flash( 'warning', 'action-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: action.slug
		} );
		States.find( function (err, states)
		{
			res.render( 'edit', { action: action, states: states } );
		} );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'action-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}
	var action = {
		slug: req.body.slug,
		text: req.body.actionText,
		startingState: req.body.startingState,
		endingState: req.body.endingState,
		eventFormat: req.body.eventFormat
	};
	console.log(action)
	Actions.update( { slug: req.params.slug }, action, function( status ) {
		req.flash( 'success', 'action-update' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
