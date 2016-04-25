"use strict";

var	express = require( 'express' ),
	app = express();

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

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
		res.render( 'index', { members: activeMembers } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};