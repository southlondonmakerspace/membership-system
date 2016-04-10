"use strict";

var	express = require( 'express' ),
	app = express();

app.get( '/', function( req, res ) {
	var response = [ 'API not yet implemented' ];
	res.setHeader( 'Content-Type', 'application/json' );
	res.send( JSON.stringify( response ) );
} );

module.exports = app;