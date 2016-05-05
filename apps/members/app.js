"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
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
	Members.find().populate( 'permissions.permission' ).exec( function( err, members ) {
		var activeMembers = [];
		for ( var m = 0; m < members.length; m++ ) {
			if ( members[m].activated ) {
				var permissions = members[m].permissions;
				for ( var p = 0; p < permissions.length; p++ ) {
					if ( permissions[p].permission.slug == 'member'
						&& permissions[p].date_added <= new Date()
						&& (
							permissions[p].date_expires == undefined 
							|| permissions[p].date_expires > new Date()
							) ) {
						activeMembers.push( members[m] );
					}
				}
			}
		}
		res.render( 'members', { members: activeMembers } );
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

		discourse.getUserByEmail( member.discourse.email, function( discourse ) {
			res.render( 'member', { member: member, discourse: discourse, discourse_path: config.discourse.url } );
		} );
	} );
} );


module.exports = function( config ) {
	app_config = config;
	return app;
};