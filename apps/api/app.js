"use strict";

var	express = require( 'express' ),
	app = express();

var config = require( '../../config/config.json' );

var Members = require( '../../src/js/database' ).Members;

app.get( '/', function( req, res ) {
	var response = [ 'API not yet implemented' ];
	res.setHeader( 'Content-Type', 'application/json' );
	res.send( JSON.stringify( response ) );
} );

app.get( '/permission/:slug/:tag', function( req, res ) {
	if ( config.api_key == req.query.api_key  ) {
		Members.findOne( { tag_hashed: req.params.tag } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			var grantAccess = false;
			if ( member != undefined ) {
				var hasMembership = false;
				var hasPermission = false;
				var isTrustee = false;
				
				for ( var p = 0; p < member.permissions.length; p++ ) {
					var permission = member.permissions[p];
					if ( permission.permission.slug == 'trustee' && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) isTrustee = true;
					if ( permission.permission.slug == 'member' && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) hasMembership = true;
					if ( permission.permission.slug == req.params.slug && permission.date_added <= new Date() && ( permission.date_expires == undefined || permission.date_expires > new Date() ) ) hasPermission = true;
				}

				if ( isTrustee || ( hasMembership && hasPermission ) )
					grantAccess = true;
			}

			if ( grantAccess ) {
				res.sendStatus( 200 );
			} else {
				res.sendStatus( 403 );
			}
		} );
	} else {
		res.sendStatus( 403 );
	}
} );

module.exports = app;