var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

var database = require( __js + '/database' ),
	Items = database.Items,
	States = database.States,
	Events = database.Events;

app.get( '/:slug', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');
	if ( ! req.params.slug ) {
		res.sendStatus( 404 );
		return;
	}
	// find the item
	Items.findOne( { 'slug': req.params.slug } )
		.populate( 'defaultState' )
		.exec( function ( err, item ) {
			if ( err ) {
				res.sendStatus( 404 );
				return;
			}

			Events.findOne( { 'item': item._id } )
				.populate( 'item' )
				.populate( 'state' )
				.sort( { 'happened': -1 } )
				.exec( function ( err, event ) {

					var output = {
						name: item.name,
						slug: item.slug
					};

					if ( item.description ) output.description = item.description;
					if ( item.guide ) output.description = item.guide;

					if ( ! event ) {
						output.state = {
							text: event.state.text,
							slug: event.state.slug,
							colour: event.state.colour
						};
					} else {
						output.state = {
							text: item.defaultState.text,
							slug: item.defaultState.slug,
							colour: item.defaultState.colour
						};
					}

					res.send( JSON.stringify( output ) );
				} );
		} );
});

app.get( '/:slug/:state', auth.isAPIAuthenticated, function( req, res ) {
	res.setHeader('Content-Type', 'application/json');

	if ( ! req.params.slug ) {
		res.sendStatus( 404 );
		return;
	}

	// find the item
	Items.findOne( { 'slug': req.params.slug } )
		.exec( function( err, item ) {
			
			if ( err ) {
				res.sendStatus( 404 );
				return;
			}

			States.findOne( { 'slug': req.params.state }, function( err, lastState ) {
				if ( err || lastState == null ) {
					res.sendStatus( 404 );
					return;
				}

				var newEvent = {
					successful: true,
					item: item._id,
					state: lastState._id
				};

				new Events ( newEvent ).save( function( status ) {
					res.send( status );
				} );
			} );
		} );
} );

module.exports = function() {
	return app;
};
