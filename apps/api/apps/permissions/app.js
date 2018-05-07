var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' ),
	Mail = require( __js + '/mail' ),
	Options = require( __js + '/options' )();

var database = require( __js + '/database' ),
	Members = database.Members,
	Permissions = database.Permissions,
	Events = database.Events;

var app_config = {};

app.get( '/:slug/:tag', auth.apiCan( 'api-member-permission-check' ), function( req, res ) {
	Members.findOne( { 'tag.hashed': req.params.tag } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		var grantAccess = false;
		if ( member ) {
			var hasMembership = false;
			var hasPermission = false;
			var isSuperAdmin = false;

			for ( var p = 0; p < member.permissions.length; p++ ) {
				var permission = member.permissions[p];
				if ( permission.permission.slug == config.permission.superadmin && permission.date_added <= new Date() && ( ! permission.date_expires || permission.date_expires > new Date() ) ) isSuperAdmin = true;
				if ( permission.permission.slug == config.permission.member && permission.date_added <= new Date() && ( ! permission.date_expires || permission.date_expires > new Date() ) ) hasMembership = true;
				if ( permission.permission.slug == req.params.slug && permission.date_added <= new Date() && ( ! permission.date_expires || permission.date_expires > new Date() ) ) hasPermission = true;
			}

			if ( ( isSuperAdmin && hasPermission ) || ( hasMembership && hasPermission ) ) {
				Permissions.findOne( { slug: req.params.slug }, function ( err, permission ) {
					new Events( {
						member: member._id,
						permission: permission._id,
						successful: true
					} ).save( function( status ) {} );
				} );
				res.send( JSON.stringify( {
					name: member.fullname
				} ) );
			} else {
				res.sendStatus( 403 );
				Permissions.findOne( { slug: req.params.slug }, function ( err, permission ) {
					if ( permission )
						new Events( {
							member: member._id,
							permission: permission._id,
							successful: false
						} ).save( function( status ) {} );
				} );
			}
		} else {
			res.sendStatus( 404 );
		}
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
