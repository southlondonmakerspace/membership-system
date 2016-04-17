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
	passport.use( new LocalStrategy( {
		usernameField: 'email'
	}, function( email, password, done ) {
			Members.findOne( { email: email }, function( err, user ) {
				if ( user != null ) {
					hashPassword( password, user.password_salt, function( hash ) {
						if ( hash == user.password_hash ) {
							if ( user.activated ) {
								return done( null, { _id: user._id }, { message: 'Login successful' } );
							} else {
								return done( null, false, { message: 'Account not activated' } );
							}
						}
						return done( null, false, { message: 'Login unsuccessful' } );
					} );
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
				var permissions = [ 'loggedIn' ];

				if ( superAdmin( user.email ) )
					permissions.push( 'superadmin' );

				for ( var p = 0; p < user.permissions.length; p++ ) {
					if ( user.permissions[p].date_added <= new Date() ) {
						if ( user.permissions[p].date_expires == undefined || user.permissions[p].date_expires > new Date() ) {
							permissions.push( user.permissions[p].permission.slug );
						}
					}
				}

				user.quickPermissions = permissions;

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

function generateActivationCode( callback ) {
	crypto.randomBytes( 10, function( ex, code ) {
		callback( code.toString( 'hex' ) );
	} );
}

function generateSalt( callback ) {
	crypto.randomBytes( 256, function( ex, salt ) {
		callback( salt.toString( 'hex' ) );
	} );
}

function hashPassword( password, salt, callback ) {
	crypto.pbkdf2( password, salt, 1000, 512, 'sha512', function( err, hash ) {
		callback( hash.toString( 'hex' ) );
	} );
}

function generatePassword( password, callback ) {
	generateSalt( function( salt ) {
		hashPassword( password, salt, function( hash ) {
			callback( {
				salt: salt,
				hash: hash
			} );
		} );
	} );
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
	if ( req.user == undefined ) return false;
	if ( req.user.quickPermissions.indexOf( permission ) != -1 ) return true;
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
			if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
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
			if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
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
			if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
			req.flash( 'error', 'You must be logged in first' );
			res.redirect( '/login' );
			return;
	}
}

function hashCard( id ) {
	var md5 = crypto.createHash( 'md5' );
	md5.update( config.tag_salt );
	md5.update( id.toLowerCase() );
	return md5.digest( 'hex' );
}

function passwordRequirements( password ) {
	if ( password.length < 8 )
		return "Password must be at least 8 characters long";

	if ( password.match( /\d/g ) == null )
		return "Password must contain at least 1 number"

	if ( password.match( /[A-Z]/g ) == null )
		return "Password must contain at least 1 uppercase letter"

	if ( password.match( /[a-z]/g ) == null )
		return "Password must contain at least 1 lowercase letter"

	return true;
}

module.exports = authentication;
module.exports.generateSalt = generateSalt;
module.exports.generatePassword = generatePassword;
module.exports.generateActivationCode = generateActivationCode;
module.exports.hashPassword = hashPassword;
module.exports.isLoggedIn = isLoggedIn;
module.exports.isMember = isMember;
module.exports.isAdmin = isAdmin;
module.exports.hashCard = hashCard;
module.exports.passwordRequirements = passwordRequirements;