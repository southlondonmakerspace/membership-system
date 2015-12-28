"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Admin",
		url: "/admin"
	} );
	res.locals.activeApp = 'admin';
	next();
} );

app.get( '/', ensureAuthenticated, function( req, res ) {
	res.render( 'admin' );
} );

/*
 *	MEMBERS
 */

var members = express();
members.set( 'views', __dirname + '/views' );

members.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Members",
		url: "/admin/members"
	} );
	next();
} );

members.get( '/', ensureAuthenticated, function( req, res ) {
	Members.find( function( err, members ) {
		res.render( 'members', { members: members } );
	} );
} );

members.get( '/:id/edit', ensureAuthenticated, function( req, res ) {
	Members.findOne( { _id: req.params.id }, function( err, member ) {
		res.locals.breadcrumb.push( {
			name: member.fullname
		} );
		res.render( 'edit-member', { member: member } );
	} );
} );

members.post( '/:id/edit', ensureAuthenticated, function( req, res ) {
	var member = {
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		tag_id: req.body.tag_id,
		address: req.body.address
	};

	Members.update( { _id: req.params.id }, member, function( status ) {
		req.flash( 'success', 'Members updated' );
		res.redirect( '/admin/members/' + req.params.id + '/edit' );
	} );
} );

app.use( '/members', members );

/*
 *	PERMISSIONS
 */

var permissions = express();
permissions.set( 'views', __dirname + '/views' );

permissions.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Permissions",
		url: "/admin/permissions"
	} );
	next();
} );

permissions.get( '/', ensureAuthenticated, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		res.render( 'permissions', { permissions: permissions } );
	} );
} );

permissions.get( '/create', ensureAuthenticated, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create-permission' );
} );

permissions.post( '/create', ensureAuthenticated, function( req, res ) {
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

permissions.get( '/:id/edit', ensureAuthenticated, function( req, res ) {
	Permissions.findOne( { _id: req.params.id }, function( err, permission ) {
		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.render( 'edit-permission', { permission: permission } );
	} );
} );

permissions.post( '/:id/edit', ensureAuthenticated, function( req, res ) {
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

app.use( '/permissions', permissions );

/*
 *	SETTINGS
 */

 app.get( '/settings', ensureAuthenticated, function( req, res ) {
 	req.flash( 'info', 'This area has not yet been built.' );
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
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}