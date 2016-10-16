"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	Events = require( __js + '/database' ).Events;

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

	if ( req.query.month != undefined && req.query.year != undefined ) {
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
	}
	Events.find( search ).populate( 'member' ).populate( 'permission' ).sort( [ [ "happened", -1 ] ] ).exec( function( err, events ) {
		for ( var e = 1; e < events.length; e++ ) {
			var event = events[e];
			var prevEvent = events[e-1];
			if ( event.happened.getDate() != prevEvent.happened.getDate() )
				event.split = true;
		}
		var previousDate = new Date( startDate );
		previousDate.setMonth( startDate.getMonth() - 1 );
		res.render( 'events', {
			events: events,
			previous: previousDate,
			next: endDate,
			searchDate: startDate
		} );
	} )
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
