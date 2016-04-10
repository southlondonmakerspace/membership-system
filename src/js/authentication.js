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
			Members.findOne( { email: email }, function( err, user ) {
				if ( user != null ) {
					var password_hash = generatePassword( password, user.password_salt ).hash;
					if ( password_hash == user.password_hash ) {
						if ( user.activated ) {
							return done( null, { _id: user._id }, { message: 'Login successful' } );
						} else {
							return done( null, false, { message: 'Account not activated' } );
						}
					}
					return done( null, false, { message: 'Login unsuccessful' } );
				} else {
					return done( null, false, { message: 'Login unsuccessful' } );
				}
			} );
		}
	) );

	passport.serializeUser( function( data, done ) {
		done( null, data );
	} );

	passport.deserializeUser( function( data, done ) {
		Members.findById( data._id ).populate( 'permissions.permission' ).exec( function( err, user ) {
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
	if ( ! status ) {
		return status;
	} else {
		if ( checkPermission( req, 'member' ) ) return true;
		if ( checkPermission( req, 'trustee' ) ) return true;
		if ( checkPermission( req, 'admin' ) ) return true;
		if ( superAdmin( req.user.email ) ) return true;
	}
	return -2;
}

function canAdmin( req ) {
	// Check user is logged in
	var status = loggedIn( req );
	if ( ! status ) {
		return status;
	} else {
		if ( checkPermission( req, 'trustee' ) ) return true;
		if ( checkPermission( req, 'admin' ) ) return true;
		if ( superAdmin( req.user.email ) ) return true;
	}
	return -3;
}

function checkPermission( req, permission ) {
	if ( req.user == undefined ) return;
	for ( var p = 0; p < req.user.permissions.length; p++ ) {
		if ( req.user.permissions[p].permission.slug == permission ) {
			if ( req.user.permissions[p].date_added <= new Date() ) {
				if ( req.user.permissions[p].date_expires == undefined || req.user.permissions[p].date_expires > new Date() ) {
					return true;
				}
			}
		}
	}
	return false;
}

function isLoggedIn( req, res, next ) {
	var status = loggedIn( req );
	switch ( status ) {
		case true:
			return next();
		case -1:
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		default:
		case false:
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

function isMember( req, res, next ) {
	var status = activeMember( req );
	switch ( status ) {
		case true:
			return next();
		case -1:
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		case -2:
			req.flash( 'warning', 'Your membership is inactive' );
			res.redirect( '/profile' );
			return;
		default:
		case false:
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

function isAdmin( req, res, next ) {
	var status = canAdmin( req );
	switch ( status ) {
		case true:
			return next();
		case -1:
			req.flash( 'warning', 'Your account is not yet activated' );
			res.redirect( '/' );
			return;
		case -2:
			req.flash( 'warning', 'Your membership is inactive' );
			res.redirect( '/profile' );
			return;
		case -3:
			req.flash( 'warning', 'You do not have access to this area' );
			res.redirect( '/profile' );
			return;
		default:
		case false:
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