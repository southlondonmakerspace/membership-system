var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Events = db.Events,
	Permissions = db.Permissions,
	Activities = db.Activities;

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
	var startDate = new Date();
	startDate.setDate( 1 );
	startDate.setHours( 0 );
	startDate.setMinutes( 0 );
	startDate.setSeconds( 0 );
	startDate.setMilliseconds( 0 );

	if ( req.query.month !== undefined && req.query.year !== undefined ) {
		startDate.setMonth( req.query.month - 1 );
		startDate.setYear( req.query.year );
	}
	var endDate = new Date( startDate );
	endDate.setMonth( startDate.getMonth() + 1 );
	var search = {
		happened: {
			$gte: startDate,
			$lt: endDate
		}
	};
	// FILTER: Permission Success
	if ( req.query.successful && req.query.unsuccessful === undefined ) search.successful = { $ne: false };
	if ( req.query.unsuccessful && req.query.successful === undefined ) search.successful = false;

	// FILTER: Permission
	Permissions.findOne( { slug: req.query.permission }, function( err, permission ) {
		if ( permission !== null ) {
			search.permission = permission._id;
		}

		// FILTER: Activities
		Activities.findOne( { slug: req.query.activity }, function( err, activity ) {
			if ( activity !== null ) {
				search.activity = activity._id;
			}

			// Find event
			Events.find( search ).populate( 'member' ).populate( 'permission' ).populate( 'activity' ).sort( [ [ "happened", -1 ] ] ).exec( function( err, events ) {
				if ( res.locals.access.indexOf( 'admin' ) == -1 ) {
					events = events.filter( function( e ) {
						if ( e.activity !== undefined )
							return ! e.activity.admin_only;
						return true;
					} );
				}
				for ( var e = 1; e < events.length; e++ ) {
					var event = events[e];
					var prevEvent = events[e-1];
					if ( event.happened.getDate() != prevEvent.happened.getDate() )
						event.split = true;
				}
				var previousDate = new Date( startDate );
				previousDate.setMonth( startDate.getMonth() - 1 );
				// Fetch full list of permissions
				Permissions.find( { event_name: { $exists: true, $ne: '' } }, function( err, permissions ) {
					// Fetch full list of activities
					Activities.find( function( err, activities ) {
						var selected = req.query;
						if ( Object.keys( req.query ).length === 0 ) {
							selected.successful = 'on';
							selected.unsuccessful = 'on';
							selected.admin_only = '';
						}

						if ( auth.canAdmin( req ) && req.query.admin_only !== undefined && req.query.admin_only == 'on' ) {
							events = events.filter( function ( event ) {
								if ( event.activity !== undefined ) {
									if ( event.activity.admin_only !== undefined ) {
										if ( event.activity.admin_only === true ) {
											return true;
										} else {
											return false;
										}
									} else {
										return false;
									}
								} else {
									return false;
								}
							} );
						}

						res.render( 'index', {
							events: events,
							previous: previousDate,
							next: endDate,
							searchDate: startDate,
							permissions: permissions,
							activities: activities,
							selected: selected
						} );
					} );
				} );
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
