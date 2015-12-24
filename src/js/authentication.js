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
						return done( null, { _id: user._id }, { message: 'User login successful' } );
					} else {
						return done( null, false, { message: 'Unauthorised user' } );
					}
				} );
			} );
		}
	) );

	passport.serializeUser( function( id, done ) {
		done( null, id );
	} );

	passport.deserializeUser( function( id, done ) {
		database.Members.findById( id, function( err, user ) {
			if ( user != null ) {
				return done( null, user );
			} else {
				return done( null, false, { message: 'Please login' } );
			}
		} );
	} );

	// Include support for passport and sessions
	app.use( passport.initialize() );
	app.use( passport.session() );

}
