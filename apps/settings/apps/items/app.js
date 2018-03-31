var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Items = db.Items,
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
	Items.find( function( err, items ) {
		if ( err ) {
			req.log.error( {
				app: 'settings/items',
				action: 'list',
				error: 'Error retrieving list of items ' + err,
				body: req.body
			} );
		}
		res.render( 'index', { items: items } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
		States.find( function (err, states) {
			if ( err ) {
				req.log.error( {
					app: 'settings/items',
					action: 'create',
					error: 'Error finding items ' + err,
					body: req.body
				} );
			}
			res.render( 'create', { states: states } );
		});

} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.log.debug( {
			app: 'settings/items',
			action: 'create',
			error: 'Name not provided',
			body: req.body
		} );
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.log.debug( {
			app: 'settings/items',
			action: 'create',
			error: 'Slug not provided',
			body: req.body
		} );
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
		if ( ! err ) {
			req.log.debug( {
				app: 'settings/items',
				action: 'create',
				error: 'Item created',
				body: req.body
			} );
			req.flash( 'success', 'item-created' );
			res.redirect( app.parent.mountpath + app.mountpath );
		} else {
			req.log.error( {
				app: 'settings/items',
				action: 'create',
				error: 'Error creating item:' + err,
				body: req.body
			} );
			req.flash( 'danger', 'item-not-created' );
			res.redirect( app.parent.mountpath + app.mountpath + '/create');
		}
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Items.findOne( { slug: req.params.slug }).exec ( function( err, item ) {
		if ( err ) {
			req.log.debug( {
				app: 'settings/items',
				action: 'edit',
				error: 'Error retrieving item to edit ' + err,
				body: req.body
			} );
		}
		if ( ! item ) {
			req.log.debug( {
				app: 'settings/items',
				action: 'list',
				error: 'Item could not be retrieved',
				body: req.body
			} );
			req.flash( 'warning', 'item-404' );
			res.redirect( app.parent.mountpath + app.mountpath);
			return;
		}

		res.locals.breadcrumb.push( {
			name: item.name
		} );
		States.find( function (err, states) {
			if ( err ) {
				req.log.error( {
					app: 'settings/items',
					action: 'edit',
					error: 'Error retrieving list of states ' + err,
					body: req.body
				} );
			}
			res.render( 'edit', { item: item, states: states } );
		} );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.log.debug( {
			app: 'settings/items',
			action: 'edit',
			error: 'Name not provided',
			body: req.body
		} );
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.log.debug( {
			app: 'settings/items',
			action: 'edit',
			error: 'Slug not provided',
			body: req.body
		} );
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
		req.log.debug( {
			app: 'settings/items',
			action: 'edit',
			error: 'Item updated',
			body: req.body
		} );
		req.flash( 'success', 'item-updated' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
