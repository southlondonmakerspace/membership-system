"use strict";

var	express = require( 'express' ),
	app = express();

app.set( 'views', __dirname + '/../views' );

app.get( '/', function ( req, res ) {
	if ( ! req.user ) {
		res.render( 'index' );
	} else {
		res.redirect( '/profile' );
	}
} );

module.exports = app;