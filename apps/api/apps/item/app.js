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
	Items = database.Items,
	States = database.States,
	Events = database.Events;

var app_config = {};

app.get( '/:slug', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.params.slug ) {
		res.sendStatus( 404 );
		return
	}
	// find the item
	Items.findOne( { 'slug': req.params.slug } ).exec( function ( err, item ) {
		if ( err ) {
			res.sendStatus( 404 );
			return
		}
		// find the last state by looking back in the event log
		Events.findOne( { 'item': item._id } )
		.populate( 'item' )
		.sort( [ [ "happened", -1 ] ] ).exec( function ( err, myEvent ) {
			res.send( JSON.stringify( { item: myEvent.item, state: myEvent.state } ) );
		} );
	} );
});

app.get( '/:slug/:state', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.params.slug ) {
		res.sendStatus( 404 );
		return
	}
	// find the item
	Items.findOne( { 'slug': req.params.slug } ).exec( function( err, item ) {
		if ( err ) {
			res.sendStatus( 404 );
			return
		}

		States.findOne( { 'slug': req.params.state }, function( err, myStateDoc ) {
			if ( err || myStateDoc == null ) {
				res.sendStatus( 403 ); // something bad happened
				return
			}

			var newEvent = {
				successful: true,
				item: item._id,
				state: myStateDoc._id
			}
			new Events ( newEvent ).save( function( status ) {
				res.send( status )
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
