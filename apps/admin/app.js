"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

var auth = require( '../../src/js/authentication.js' );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Admin",
		url: "/admin"
	} );
	res.locals.activeApp = 'admin';
	next();
} );

app.get( '/', auth.isAdmin, function( req, res ) {
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

members.get( '/', auth.isAdmin, function( req, res ) {
	Members.find( function( err, members ) {
		res.render( 'members', { members: members } );
	} );
} );

members.get( '/:id/edit', auth.isAdmin, function( req, res ) {
	Members.findOne( { _id: req.params.id }, function( err, member ) {
		if ( member != undefined ) {
			res.locals.breadcrumb.push( {
				name: member.fullname
			} );
			res.render( 'edit-member', { member: member } );
		} else {
			res.render( '../../../src/views/404' );
		}
	} );
} );

members.post( '/:id/edit', auth.isAdmin, function( req, res ) {
	var member = {
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

members.get( '/:id/permissions', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { _id: req.params.id } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id + '/edit'
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions'
			} );
			res.render( 'member-permissions', { permissions: permissions, member: member, now: new Date() } );
		} );
	} );
} );

members.post( '/:id/permissions', auth.isAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
		if ( permission != undefined ) {
			var new_permission = {
				permission: permission._id
			}

			new_permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );

			if ( req.body.expiry_date != '' && req.body.expiry_time != '' )
				new_permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

			if ( new_permission.date_added >= new_permission.date_expires ) {
				req.flash( 'warning', 'Expiry date must not be the same as or before the start date' );
				res.redirect( '/admin/members/' + req.params.id + '/permissions' );
				return;
			}

			Members.update( { _id: req.params.id }, {
				$push: {
					permissions: new_permission
				}
			}, function ( status ) {
				console.log( status );
			} );
		} else {
			req.flash( 'warning', 'Invalid permission selected' );
		}
		res.redirect( '/admin/members/' + req.params.id + '/permissions' );
	} );
} );

members.get( '/:id/permissions/:index/modify', auth.isAdmin, function( req, res ) {
	req.flash( 'info', 'Not yet implemented' );
	res.redirect( '/admin/members/' + req.params.id + '/permissions' );
} );

members.get( '/:id/permissions/:index/revoke', auth.isAdmin, function( req, res ) {
	req.flash( 'info', 'Not yet implemented' );
	res.redirect( '/admin/members/' + req.params.id + '/permissions' );
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

permissions.get( '/', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		res.render( 'permissions', { permissions: permissions } );
	} );
} );

permissions.get( '/create', auth.isAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create-permission' );
} );

permissions.post( '/create', auth.isAdmin, function( req, res ) {
	var permission = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description
	};

	new Permissions( permission ).save( function( err, permission ) {
		req.flash( 'success', 'Permission created' );
		res.redirect( '/admin/permissions/' + permission._id + '/edit' );
	} );
} );

permissions.get( '/:id/edit', auth.isAdmin, function( req, res ) {
	Permissions.findOne( { _id: req.params.id }, function( err, permission ) {
		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.render( 'edit-permission', { permission: permission } );
	} );
} );

permissions.post( '/:id/edit', auth.isAdmin, function( req, res ) {
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

 app.get( '/settings', auth.isAdmin, function( req, res ) {
 	req.flash( 'info', 'This area has not yet been built.' );
 	res.redirect( '/admin' );
 } );

module.exports = app;