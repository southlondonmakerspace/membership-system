// Handle all authentication

"use strict";

var config = require( '../../config/config.json' ),
	database = require( './database'),
	passport = require( 'passport' ),
	PersonaStrategy = require( 'passport-persona' ).Strategy;

module.exports =  function( app ) {

	// Add support for persona authentication
	passport.use( new PersonaStrategy( { audience: config.audience },
		function( email, done ) {
			process.nextTick( function () {
				database.Members.findOne( { email: email }, function( err, user ) {
					if ( user != null ) {
						console.log( user );
						return done( null, { email: email }, { message: 'User login successful' } );
					} else {
						return done( null, false, { message: 'Unauthorised user' } );
					}
				} );
			} );
		}
	) );

	passport.serializeUser( function( user, done ) {
		done( null, user.email );
	} );

	passport.deserializeUser( function( email, done ) {
		done( null, { email: email } );
	} );

	// Include support for passport and sessions
	app.use( passport.initialize() );
	app.use( passport.session() );

}
