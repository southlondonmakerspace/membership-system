"use strict";

var	express = require( 'express' ),
	app = express();

app.get( '/' , function( req, res ) {
	req.logout();
	req.flash( 'success', 'Logged out' );
	res.redirect( '/' );
} );

module.exports = function() { return app; };