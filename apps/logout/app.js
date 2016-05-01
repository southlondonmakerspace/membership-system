"use strict";

var	express = require( 'express' ),
	app = express();

var messages = require( '../../src/messages.json' );

app.get( '/' , function( req, res ) {
	req.logout();
	req.flash( 'success', messages['logged-out'] );
	res.redirect( '/' );
} );

module.exports = function() { return app; };