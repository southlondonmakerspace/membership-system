var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members;

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
	Permissions.find( function( err, permissions ) {
		res.render( 'index', { permissions: permissions } );
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
		req.flash( 'danger', 'permission-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'permission-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var permission = {
		name: req.body.name,
		event_name: req.body.event,
		event_unauthorised: req.body.event_unauthorised,
		slug: req.body.slug,
		description: req.body.description,
		group: {
			id: req.body.group_id,
			name: req.body.group_name,
			order: req.body.group_order
		}
	};

	new Permissions( permission ).save( function( err, permission ) {
		req.flash( 'success', 'permission-created' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) {
			req.flash( 'warning', 'permission-404' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.render( 'edit', { permission: permission } );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'permission-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'permission-slug-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var permission = {
		name: req.body.name,
		event_name: req.body.event,
		event_unauthorised: req.body.event_unauthorised,
		slug: req.body.slug,
		description: req.body.description,
		group: {
			id: req.body.group_id,
			name: req.body.group_name,
			order: req.body.group_order
		}
	};

	Permissions.update( { slug: req.params.slug }, permission, function( status ) {
		req.flash( 'success', 'permission-updated' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
