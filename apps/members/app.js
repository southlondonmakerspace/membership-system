"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	Permissions = require( __js + '/database' ).Permissions,
	Members = require( __js + '/database' ).Members;

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	Permissions.findOne( { slug: 'member' }, function( err, membership_permission ) {
		Permissions.find( function( err, allPermissions ) {
			Members.find( {
				permissions: {
					$elemMatch: {
						permission: membership_permission._id,
						date_added: { $lte: new Date() },
						$or: [
							{ date_expires: null },
							{ date_expires: { $gt: new Date() } }
						]
					}
				}
			} ).sort( [ [ 'lastname', 1 ], [ 'firstname', 1 ] ] ).populate( 'permissions.permission' ).exec( function( err, members ) {
				if ( req.query.permission != undefined )
					members = members.filter( function( member ) {
						var matched;
						for ( var p = 0; p < member.permissions.length; p++ )
							if ( member.permissions[p].permission.slug == req.query.permission &&
								 member.permissions[p].date_added <= new Date() &&
								 ( member.permissions[p].date_expires >= new Date() ||
								   member.permissions[p].date_expires == undefined
							 	 )
							)
								matched = true;
						if ( matched )
							return member;
						return;
					} );
				res.render( 'members', { permissions: allPermissions, members: members } );
			} );
		} )
	} );
} );

app.get( '/:uuid', auth.isMember, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname
		} );

		discourse.getUsername( member.discourse.username, function( discourse ) {
			res.render( 'member', { member: member, discourse: discourse, discourse_path: config.discourse.url } );
		} );
	} );
} );


module.exports = function( config ) {
	app_config = config;
	return app;
};
