"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var Members = require( __js + '/database' ).Members;

var app_config = {};

app.get( '/permission/:slug/:tag', function( req, res ) {
	if ( config.api_key == req.query.api_key  ) {
		Members.findOne( { 'tag.hashed': req.params.tag } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			var grantAccess = false;
			if ( member != undefined ) {
				var hasMembership = false;
				var hasPermission = false;
				var isDirector = false;

				for ( var p = 0; p < member.permissions.length; p++ ) {
					var permission = member.permissions[p];
					if ( permission.permission.slug == 'director' && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) isDirector = true;
					if ( permission.permission.slug == 'member' && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) hasMembership = true;
					if ( permission.permission.slug == req.params.slug && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) hasPermission = true;
				}

				if ( ( isDirector && hasPermission ) || ( hasMembership && hasPermission ) )
					grantAccess = true;
			}

			if ( grantAccess ) {
				res.send( JSON.stringify( {
					name: member.fullname
				} ) );
			} else {
				res.sendStatus( 403 );
			}
		} );
	} else {
		res.sendStatus( 403 );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
