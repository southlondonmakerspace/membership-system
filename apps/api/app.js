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
	Members = database.Members,
	Events = database.Events;
	Items = database.Items;
	Actions = database.Actions;

var app_config = {};

app.get( '/permission/:slug/:tag', auth.isAPIAuthenticated, function( req, res ) {
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
app.get( '/item/:slug', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.params.slug )
	{
		res.sendStatus( 404 );
		return
	}
	// find the item
	Items.findOne({'slug': req.params.slug }).exec( function (err, item) {
		if (err)
		{
			res.sendStatus( 404 );
			return
		}
		// find the last state by looking back in the event log
		Events.findOne({'item': item._id})
		.populate({path: 'action',select: 'endingState', populate: {path: 'endingState', select: "slug"}})
		.populate()
		.populate('item')
		.sort( [ [ "happened", -1 ] ] ).exec( function (err, myEvent) {

			res.send(JSON.stringify({currentStatus: myEvent.action.endingState.slug}))
		});
	});
});

app.get( '/item/:slug/:state', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.params.slug )
	{
		res.sendStatus( 404 );
		return
	}
	// find the item
	Items.findOne({'slug': req.params.slug }).populate('actions').exec( function (err, item) {
		if (err)
		{
			res.sendStatus( 404 );
			return
		}
		var initialState = null
		// find the last state by looking back in the event log
		Events.findOne({'item': item._id}).populate('action').sort( [ [ "happened", -1 ] ] ).exec( function (err, myEvent) {

			if (err || myEvent == null)
			{
				// no event found for the item
				// we use the default state
				initialState = item.defaultState
			} else {
				initialState = myEvent.action.endingState;
			}
			States.findOne({'slug': req.params.state}, function (err, finalStateDoc) {
				if (err || finalStateDoc == null)
				{
					res.sendStatus(403); // something bad happened
					return
				}

				finalState = finalStateDoc._id
				Actions.findOne({'startingState': initialState, 'endingState': finalState}, function (err, action) {
					if (err || action == null)
					{
						res.sendStatus(404);
						return
					}
					var newEvent = {
						action: action._id,
						successful: true,
						item: item._id
					}
					new Events ( newEvent ).save(function( status ) {
						res.send(status)
					} );

				})
			});
		});
	});
} );

app.get( '/events', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');

	if ( ! req.query.since ) return res.sendStatus( 404 );
	var date = moment( req.query.since );

	if ( ! date.isValid() ) return res.sendStatus( 404 );
	var limit = 10;

	var page = 1;
	if ( req.query.page ) page = parseInt( req.query.page );

	if ( req.query.limit ) {
		var raw_limit = parseInt( req.query.limit );
		if ( req.query.limit > 0 && req.query.limit <= 100 )
			limit = raw_limit;
	}
	Events.find( {
		happened: {
			$gt: date.toDate()
		}
	} )
	.limit( limit )
	.skip( ( page - 1 ) * limit )
	.sort( { happened: 'asc' } )
	.populate( 'member' )
	.populate( 'permission' )
	.exec( function( err, events ) {
		var output = {
			now: new Date(),
			since: date.toDate(),
			limit: limit,
			page: page,
			results: events.length,
			events: []
		};
		for ( var e in events ) {
			var event = events[e];
			var output_event = {
				date: event.happened
			};
			if ( event.member )
				output_event.user = {
					fullname: event.member.fullname,
					firstname: event.member.firstname,
					lastname: event.member.lastname,
					gravatar: event.member.gravatar
				};

			if ( event.permission )
				output_event.permission = {
					name: event.permission.name,
					action: event.permission.event_name
				}

			output.events.push( output_event );
		}
		res.send( JSON.stringify( output ) );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
