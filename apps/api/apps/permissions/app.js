const { request } = require('express');

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

/* Migrate permissions to new system */
const superagent = require('superagent');

const toolIdMap = {
	'shutter': 4,
	'door': 3,
	'access': 3,
	'test': 21 // D94081A2 example tag ID (not hashed)
};

app.get( '/:slug/:tag', auth.apiCan( 'api-member-permission-check' ), function( req, res ) {
	const mappedToolIdFromSlug = toolIdMap[req.params.slug];
	if (!mappedToolIdFromSlug) {
		res.sendStatus(404);
		return;
	}
	// curl https://southlondonmakerspace.org/toolcontrolJSON.php?tag_hashed=${req.params.tag}&tool=${mappedToolIdFromSlug}&espid=legacy-doorbot
	const requestToNewSystem = {
		tag: req.params.tag,
		tool: mappedToolIdFromSlug,
		espid: 'legacy-membership-api'
	};
	console.log(requestToNewSystem);
	superagent
		.post('https://southlondonmakerspace.org/toolcontrol/ToolRcvr1.php')
		.type('form')
		.send(requestToNewSystem)
		.set('accept', 'json')
		.end(function (err, fwdResponse) {
			if (fwdResponse.body.perm === 'APPROVE') {
				res.send(JSON.stringify( {
					name: fwdResponse.body.userfn
				}));
			} else {
				console.log(fwdResponse.statusCode, 'Denied access to new membership system', fwdResponse.body)
				res.sendStatus(403);
			}
		})
});

/*app.get( '/:slug/:tag', auth.apiCan( 'api-member-permission-check' ), function( req, res ) {
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
} );*/

module.exports = function( config ) {
	app_config = config;
	return app;
};
