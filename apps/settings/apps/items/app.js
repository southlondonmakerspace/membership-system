var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Items = db.Items

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
	res.render( 'create' );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', messages['item-name-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', messages['item-slug-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var item = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		guide: {
			url: req.body.guide_url,
			text: req.body.guide_text
		}
	};

	new Items( item ).save( function( err, item ) {
		req.flash( 'success', messages['item-created'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Items.findOne( { slug: req.params.slug }, function( err, item ) {
		if ( ! item ) {
			req.flash( 'warning', messages['item-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: item.name
		} );
		res.render( 'edit', { item: item } );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', messages['item-name-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', messages['item-slug-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

   var item = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		guide: {
			url: req.body.guide_url,
			text: req.body.guide_text
		}
	};

	Items.update( { slug: req.params.slug }, item, function( status ) {
		req.flash( 'success', messages['item-update'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
