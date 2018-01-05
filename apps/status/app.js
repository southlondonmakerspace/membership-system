var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var apps = [];
var app_config = {};

var auth = require( __js + '/authentication' );

var	db = require( __js + '/database' ),
	Items = db.Items,
	Events = db.Events;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	var items = [];

	Items.find().populate( 'defaultState' ).sort( { name: 1 } ).exec( function( err, results ) {
		var itemQueries = [];
		for ( var i in results ) {
			itemQueries.push( Events.findOne( { 'item': results[i]._id } ).populate( 'state' ).sort( { "happened": -1 } ) );
		}
		Promise.all( itemQueries ).then( function( queryResults ) {
			for ( var r in results ) {
				var item = results[r];
				var event = queryResults[r];
				var outputState;

				if ( event ) {
					var state = event.state;
					outputState = {
						text: state.text,
						slug: state.slug,
						colour: state.colour,
						pastTense: state.pastTense,
						presentTense: state.presentTense,
						updated: event.happened
					};
				} else {
					outputState = item.defaultState;
				}

				items.push( {
					name: item.name,
					slug: item.slug,
					description: item.description,
					guide: item.guide,
					status: outputState
				} );
			}
			res.render( 'index', { items: items } );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
