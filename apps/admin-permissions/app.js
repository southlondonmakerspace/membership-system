"use strict";

var	express = require( 'express' ),
	app = express(),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

var auth = require( '../../src/js/authentication.js' );

var messages = require( '../../src/messages.json' );

var config = require( '../../config/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: 'Admin',
		url: '/admin'
	} );
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		res.render( 'permissions', { permissions: permissions } );
	} );
} );

app.get( '/create', auth.isAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create-permission' );
} );

app.post( '/create', auth.isAdmin, function( req, res ) {
	var permission = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description
	};

	new Permissions( permission ).save( function( err, permission ) {
		req.flash( 'success', messages['permission-created'] );
		res.redirect( app.mountpath + '/' + permission._id + '/edit' );
	} );
} );

app.get( '/:id/edit', auth.isAdmin, function( req, res ) {
	Permissions.findOne( { _id: req.params.id }, function( err, permission ) {
		if ( permission == undefined ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}
	
		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.render( 'edit-permission', { permission: permission } );
	} );
} );

app.post( '/:id/edit', auth.isAdmin, function( req, res ) {
	var permission = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description
	};

	Permissions.update( { _id: req.params.id }, permission, function( status ) {
		req.flash( 'success', messages['permission-update'] );
		res.redirect( app.mountpath + '/' + req.params.id + '/edit' );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};