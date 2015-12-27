"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.get( '/', ensureAuthenticated, function( req, res ) {
	res.render( 'admin' );
} );

/*
 *	USERS
 */

app.get( '/users', ensureAuthenticated, function( req, res ) {
	Members.find( function( err, users ) {
		res.render( 'users', { users: users } );
	} );
} );

/*
 *	PERMISSIONS
 */

app.get( '/permissions', ensureAuthenticated, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		res.render( 'permissions', { permissions: permissions } );
	} );
} );

app.get( '/permissions/create', ensureAuthenticated, function( req, res ) {
	res.render( 'create-permission' );
} );

app.post( '/permissions/create', ensureAuthenticated, function( req, res ) {
	var permission = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description
	};

	new Permissions( permission ).save( function( err, permission ) {
		console.log( err );
		req.flash( 'success', 'Permission created' );
		res.redirect( '/admin/permissions/' + permission._id + '/edit' );
	} );
} );

app.get( '/permissions/:id/edit', ensureAuthenticated, function( req, res ) {
	Permissions.findOne( { _id: req.params.id }, function( err, permission ) {
		res.render( 'edit-permission', { permission: permission } );
	} );
} );

app.post( '/permissions/:id/edit', ensureAuthenticated, function( req, res ) {
	var permission = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description
	};

	Permissions.update( { _id: req.params.id }, permission, function( status ) {
		req.flash( 'success', 'Permission updated' );
		res.redirect( '/admin/permissions/' + req.params.id + '/edit' );
	} );
} );

/*
 *	SETTINGS
 */

 app.get( '/settings', ensureAuthenticated, function( req, res ) {
 	req.flash( 'info', 'This are has not yet been built.' );
 	res.redirect( '/admin' );
 } );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() && req.user != undefined && req.user.migrated == null ) {
		return next();
	} else if ( req.isAuthenticated() ) {
		res.redirect( '/migration' );
		return;		
	}

	req.session.requested = req.originalUrl;
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}