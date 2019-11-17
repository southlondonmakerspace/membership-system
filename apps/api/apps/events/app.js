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

var moment = require( 'moment' );

var database = require( __js + '/database' ),
	Events = database.Events;

var app_config = {};

app.get( '/', auth.apiCan( 'api-read-events' ), function( req, res ) {
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
	.populate( 'state' )
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
