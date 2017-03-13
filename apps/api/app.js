var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var moment = require( 'moment' );

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication.js' );

var database = require( __js + '/database' ),
	Permissions = database.Permissions,
	Activities = database.Activities,
	Members = database.Members,
	Events = database.Events;

var app_config = {};

app.get( '/permission/:slug/:tag', auth.isAPIAuthenticated, function( req, res ) {
	Members.findOne( { 'tag.hashed': req.params.tag } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		var grantAccess = false;
		if ( member !== undefined ) {
			var hasMembership = false;
			var hasPermission = false;
			var isDirector = false;

			for ( var p = 0; p < member.permissions.length; p++ ) {
				var permission = member.permissions[p];
				if ( permission.permission.slug == 'director' && permission.date_added <= new Date() && ( permission.date_expires === undefined || permission.date_expires > new Date() ) ) isDirector = true;
				if ( permission.permission.slug == 'member' && permission.date_added <= new Date() && ( permission.date_expires === undefined || permission.date_expires > new Date() ) ) hasMembership = true;
				if ( permission.permission.slug == req.params.slug && permission.date_added <= new Date() && ( permission.date_expires === undefined || permission.date_expires > new Date() ) ) hasPermission = true;
			}

			if ( ( isDirector && hasPermission ) || ( hasMembership && hasPermission ) ) {
				grantAccess = true;
			} else {
				Permissions.findOne( { slug: req.params.slug }, function ( err, permission ) {
					if ( permission !== undefined )
						new Events( {
							member: member._id,
							permission: permission._id,
							successful: false
						} ).save( function( status ) {} );
				} );
			}
		}

		if ( grantAccess ) {
			// Log access
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
		}
	} );
} );

app.get( '/event/:slug', auth.isAPIAuthenticated, function( req, res ) {
	Activities.findOne( { slug: req.params.slug }, function ( err, activity ) {
		if ( activity !== undefined ) {
			new Events( {
				activity: activity._id,
				action: ( req.query.action ? req.query.action : '' )
			} ).save( function( status ) {
				res.sendStatus( 200 );
			} );
		} else {
			res.sendStatus( 404 );
		}
	} );
} );

app.get( '/events', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.query.since ) return res.sendStatus( 404 );
	var date = moment( req.query.since );
	if ( ! date.isValid() ) return res.sendStatus( 404 );
	var limit = 10;
	if ( req.query.limit ) {
		var raw_limit = parseInt( req.query.limit );
		if ( req.query.limit > 0 && req.query.limit < 50 )
			limit = raw_limit;
	}
	Events.find( { happened: { $gt: date.toDate() } } ).limit( limit ).sort( { happened: 'asc' } ).populate( 'member' ).populate( 'permission' ).exec( function( err, events ) {
		var output = {
			now: new Date(),
			since: date.toDate(),
			limit: limit,
			events: []
		};
		for ( var e in events ) {
			var event = events[e];
			var output_event = {
				date: event.happened,
				user: {
					fullname: event.member.fullname,
					firstname: event.member.firstname,
					lastname: event.member.lastname,
					gravatar: event.member.gravatar
				},
				permission: {
					name: event.permission.name,
					action: event.permission.event_name
				}
			};
			output.events.push( output_event );
		}
		res.send( JSON.stringify( output ) );
	} );
} );

app.get( '*', function ( req, res ) {
	res.sendStatus( 501 );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
