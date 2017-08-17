var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Items = db.Items,
	Actions = db.Actions,
	Stats = db.States

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
	Items.find( function( err, items ) {
		res.render( 'index', { items: items } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	Actions.find( function (err, actions) {
		States.find( function (err, states) {
			res.render( 'create', { actions: actions, states: states } );
		});
	});
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'item-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var item = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		guide: req.body.guide,
		defaultState: req.body.defaultState
	};

	new Items( item ).save( function( err, item ) {
		req.flash( 'success', 'item-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit/action', auth.isSuperAdmin, function (req, res) {
	Actions.find().populate('startingState').populate('endingState').exec( function (err, actions) {
			res.render('add_action', { actions: actions })
	} );
} );

app.post( '/:slug/edit/action', auth.isSuperAdmin, function (req, res) {
	Items.findOne( { slug: req.params.slug }, function( err, item ) {
		if (! item ) {
			req.flash( 'warning', 'item-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		/*if ( ! req.body.slug || req.body.slug.trim() === '' ) {
			req.flash( 'danger', 'item-slug-required' );
			res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.slug + '/edit');
			return;
		}*/
		// if the action already is in the items list of actions...
		if ( item.actions.indexOf(req.body.id) != -1)
		{
			req.flash( 'warning', 'item-action-duplicate' );
			res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.slug + '/edit');
			return;
		}
		item.actions.push(req.body.id);
		Items.update( { slug: req.params.slug }, item, function (status) {
			req.flash( 'success', 'item-update' );
			res.redirect( app.parent.mountpath + app.mountpath  + '/' + req.params.slug + '/edit');
			console.log(status)
		})
	} );
} );


app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Items.findOne( { slug: req.params.slug }).populate('actions').exec ( function( err, item ) {
		if ( ! item ) {
			req.flash( 'warning', 'item-404' );
			res.redirect( app.parent.mountpath + app.mountpath);
			return;
		}

		res.locals.breadcrumb.push( {
			name: item.name
		} );
		Actions.find( function (err, actions) {
			States.find( function (err, states) {
				res.render( 'edit', { item: item, actions: item.actions, states: states } );
			});

		} );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'item-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

   var item = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		guide: req.body.guide,
		defaultState: req.body.defaultState
	};

	Items.update( { slug: req.params.slug }, item, function( status ) {
		req.flash( 'success', 'item-update' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
