// Handle all authentication

"use strict";

var config = require( '../../config/config.json' );

var database = require( './database');

var passport = require( 'passport' ),
	LocalStrategy = require( 'passport-local' ).Strategy;

var crypto = require( 'crypto' );

module.exports = function( app ) {

	// Add support for local authentication
	passport.use( new LocalStrategy( function( username, password, done ) {
			database.Members.findOne( { username: username }, function( err, user ) {
				if ( user != null ) {
					var password_hash = generatePassword( password, user.password_salt ).hash;
					if ( password_hash == user.password_hash ) {
						if ( user.activated ) {
							return done( null, { _id: user._id }, { message: 'User login successful' } );
						} else {
							return done( null, false, { message: 'Account not activated' } );
						}
					}
					return done( null, false, { message: 'Unauthorised user' } );
				} else {
					return done( null, false, { message: 'Unauthorised user' } );
				}
			} );
		}
	) );

	passport.serializeUser( function( data, done ) {
		done( null, data );
	} );

	passport.deserializeUser( function( data, done ) {
		if ( data.legacy ) {
			database.LegacyMembers.findById( data._id, function( err, user ) {
				if ( user != null ) {
					return done( null, user );
				} else {
					return done( null, false, { message: 'Please login' } );
				}
			} );
		} else {
			database.Members.findById( data._id, function( err, user ) {
				if ( user != null ) {
					return done( null, user );
				} else {
					return done( null, false, { message: 'Please login' } );
				}
			} );
		}
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

module.exports.generatePassword = generatePassword;