// Handle all authentication

"use strict";

var config = require( '../../config/config.json' );

var Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;;

var passport = require( 'passport' ),
	LocalStrategy = require( 'passport-local' ).Strategy;

var crypto = require( 'crypto' );

function authentication( app ) {
	// Add support for local authentication
	passport.use( new LocalStrategy( function( email, password, done ) {
			Members.findOne( { email: email } ).populate( 'permissions.permission' ).exec( function( err, user ) {
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
		Members.findById( data._id, function( err, user ) {
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

function superAdmin( email ) {
	if ( config.superadmins.indexOf( email ) != -1 ) {
		console.log( "SUPER ADMIN!" );
		return true;
	}
	return false;
}

function loggedIn( req ) {
	// Is the user logged in?
	if ( req.isAuthenticated() && req.user != undefined ) {
		// Is the user active
		if ( req.user.activated || superAdmin( req.user.email ) ) {
			return true;
		} else {
			return -1;
		}
	} else {
		return false;
	}
}

function activeMember( req ) {
	// Check user is logged in
	var status = loggedIn( req );
	if ( ! status || superAdmin( req.user.email ) ) {
		return status;
	} else {
		console.log( req.user.permissions );
	}
}

function canAdmin( req ) {
	// Check user is logged in
	var status = loggedIn( req );
	if ( ! status || superAdmin( req.user.email ) ) {
		return status;
	} else {
		console.log( req.user.permissions );
	}
}

function isLoggedIn( req, res, next ) {
	var status = loggedIn( req );
	console.log( status );
	switch ( status ) {
		case true:
			console.log( "Logged in and activated" );
			return next();
		case -1:
			console.log( "Logged in and not activated" );
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		default:
		case false:
			console.log( "Not logged in" );
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

function isMember( req, res, next ) {
	var status = activeMember( req );
	console.log( status );
	switch ( status ) {
		case true:
			console.log( "Logged in and activated" );
			return next();
		case -1:
			console.log( "Logged in and not activated" );
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		case -2:
			console.log( "Inactive member" );
			req.flash( 'warning', 'Your membership is inactive' );
			res.redirect( '/profile' );
			return;
		default:
		case false:
			console.log( "Not logged in" );
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

function isAdmin( req, res, next ) {
	var status = canAdmin( req );
	console.log( status );
	switch ( status ) {
		case true:
			console.log( "Logged in and activated" );
			return next();
		case -1:
			console.log( "Logged in and not activated" );
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		case -2:
			console.log( "Inactive member" );
			req.flash( 'warning', 'Your membership is inactive' );
			res.redirect( '/profile' );
			return;
		case -3:
			console.log( "Not an admin" );
			req.flash( 'warning', 'You do not have access to this area' );
			res.redirect( '/profile' );
			return;
		default:
		case false:
			console.log( "Not logged in" );
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

module.exports = authentication;
module.exports.generatePassword = generatePassword;
module.exports.isLoggedIn = isLoggedIn;
module.exports.isMember = isMember;
module.exports.isAdmin = isAdmin;


/*


function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() && req.user != undefined && req.user.migrated == null ) {
		return next();
	} else if ( req.isAuthenticated() ) {
		res.redirect( '/migration' );
		return;		
	}
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}
*/