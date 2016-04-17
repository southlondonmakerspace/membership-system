"use strict";

var	express = require( 'express' ),
	app = express();

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Members",
		url: "/members"
	} );
	res.locals.activeApp = 'members';
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

module.exports = app;