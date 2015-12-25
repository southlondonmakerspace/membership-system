// Handle all authentication

"use strict";

var config = require( '../../config/config.json' );

var database = require( './database');

var passport = require( 'passport' ),
	PersonaStrategy = require( 'passport-persona' ).Strategy,
	LocalStrategy = require( 'passport-local' ).Strategy;

var crypto = require( 'crypto' );

module.exports =  function( app ) {

	// Add support for persona authentication
	passport.use( new LocalStrategy( function( username, password, done ) {
			database.Members.findOne( { username: username }, function( err, user ) {
				if ( user != null ) {
					var password_hash = generatePassword( password, user.password_salt ).hash;
					console.log( 'submitted password: ' + password_hash );
					console.log( 'user password: ' + user.password_hash );
					if ( password_hash == user.password_hash ) {
						console.log( 'validated' );
						return done( null, { _id: user._id }, { message: 'User login successful' } );
					}
					return done( null, false, { message: 'Unauthorised user' } );
				} else {
					return done( null, false, { message: 'Unauthorised user' } );
				}
			} );
		}
	) );

	// Add support for persona authentication
	passport.use( new PersonaStrategy( { audience: config.audience },
		function( email, done ) {
			database.Members.findOne( { email: email }, function( err, user ) {
				if ( user != null ) {
					return done( null, { _id: user._id }, { message: 'User login successful' } );
				} else {
					return done( null, false, { message: 'Unauthorised user' } );
				}
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

function generatePassword( password, salt ) {
	if ( ! salt ) salt = crypto.randomBytes( 256 ).toString( 'hex' );
	var hash = crypto.pbkdf2Sync( password, salt, 1000, 512, 'sha512' ).toString( 'hex' )
	return {
		salt: salt,
		hash: hash
	};
}