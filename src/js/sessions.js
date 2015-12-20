// Add support for sessions

"use strict";

var session = require( 'express-session' ),
	config = require( '../../config/config.json' ),
	cookie = require('cookie-parser'),
	passport = require( 'passport' );

module.exports =  function( app ) {

	app.use( cookie() );
	app.use( session( {
		secret: config.secret,
		cookie: { maxAge: 60000 },
		saveUninitialized: false,
		resave: false,
		rolling: true
	} ) );

	app.use( passport.initialize() );
	app.use( passport.session() );

}
