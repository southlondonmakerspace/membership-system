// Handle all authentication

"use strict";

var config = require( '../../config/config.json' );

var Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;;

var passport = require( 'passport' ),
	LocalStrategy = require( 'passport-local' ).Strategy;

var crypto = require( 'crypto' );

var messages = require( '../../src/messages.json' );

var Authentication = {
	auth: function( app ) {
		// Add support for local authentication
		passport.use( new LocalStrategy( {
			usernameField: 'email'
		}, function( email, password, done ) {
				Members.findOne( { email: email }, function( err, user ) {
					if ( user != null ) {
						Authentication.hashPassword( password, user.password_salt, function( hash ) {
							if ( hash == user.password_hash ) {
								if ( user.activated || Authentication.superAdmin( user.email ) ) {
									return done( null, { _id: user._id }, { message: messages['logged-in'] } );
								} else {
									return done( null, false, { message: messages['inactive-account'] } );
								}
							}
							return done( null, false, { message: messages['login-failed'] } );
						} );
					} else {
						return done( null, false, { message: messages['login-failed'] } );
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

					if ( Authentication.superAdmin( user.email ) )
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
					return done( null, false, { message: messages['login-required'] } );
				}
			} );
		} );

		// Include support for passport and sessions
		app.use( passport.initialize() );
		app.use( passport.session() );
	},
	generateActivationCode: function( callback ) {
		crypto.randomBytes( 10, function( ex, code ) {
			callback( code.toString( 'hex' ) );
		} );
	},
	generateSalt: function( callback ) {
		crypto.randomBytes( 256, function( ex, salt ) {
			callback( salt.toString( 'hex' ) );
		} );
	},
	hashPassword: function( password, salt, callback ) {
		crypto.pbkdf2( password, salt, 1000, 512, 'sha512', function( err, hash ) {
			callback( hash.toString( 'hex' ) );
		} );
	},
	generatePassword: function( password, callback ) {
		Authentication.generateSalt( function( salt ) {
			Authentication.hashPassword( password, salt, function( hash ) {
				callback( {
					salt: salt,
					hash: hash
				} );
			} );
		} );
	},
	superAdmin: function( email ) {
		if ( config.superadmins.indexOf( email ) != -1 ) {
			return true;
		}
		return false;
	},
	loggedIn: function( req ) {
		// Is the user logged in?
		if ( req.isAuthenticated() && req.user != undefined ) {
			// Is the user active
			if ( req.user.activated || Authentication.superAdmin( req.user.email ) ) {
				return true;
			} else {
				return -1;
			}
		} else {
			return false;
		}
	},
	activeMember: function( req ) {
		// Check user is logged in
		var status = Authentication.loggedIn( req );
		if ( ! status ) {
			return status;
		} else {
			if ( Authentication.checkPermission( req, 'member' ) ) return true;
			if ( Authentication.checkPermission( req, 'trustee' ) ) return true;
			if ( Authentication.checkPermission( req, 'admin' ) ) return true;
			if ( Authentication.superAdmin( req.user.email ) ) return true;
		}
		return -2;
	},
	canAdmin: function( req ) {
		// Check user is logged in
		var status = Authentication.loggedIn( req );
		if ( ! status ) {
			return status;
		} else {
			if ( Authentication.checkPermission( req, 'trustee' ) ) return true;
			if ( Authentication.checkPermission( req, 'admin' ) ) return true;
			if ( Authentication.superAdmin( req.user.email ) ) return true;
		}
		return -3;
	},
	checkPermission: function( req, permission ) {
		if ( req.user == undefined ) return false;
		if ( req.user.quickPermissions.indexOf( permission ) != -1 ) return true;
		return false;
	},
	isLoggedIn: function( req, res, next ) {
		var status = Authentication.loggedIn( req );
		switch ( status ) {
			case true:
				return next();
			case -1:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			default:
			case false:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},
	isMember: function( req, res, next ) {
		var status = Authentication.activeMember( req );
		switch ( status ) {
			case true:
				return next();
			case -1:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case -2:
				req.flash( 'warning', messages['inactive-membership'] );
				res.redirect( '/profile' );
				return;
			default:
			case false:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},
	isAdmin: function( req, res, next ) {
		var status = Authentication.canAdmin( req );
		switch ( status ) {
			case true:
				return next();
			case -1:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case -2:
				req.flash( 'warning', messages['inactive-membership'] );
				res.redirect( '/profile' );
				return;
			case -3:
				req.flash( 'warning', messages['403'] );
				res.redirect( '/profile' );
				return;
			default:
			case false:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},
	hashCard: function( id ) {
		var md5 = crypto.createHash( 'md5' );
		md5.update( config.tag_salt );
		md5.update( id.toLowerCase() );
		return md5.digest( 'hex' );
	},
	passwordRequirements: function( password ) {
		if ( password.length < 8 )
			return messages['password-err-length'];

		if ( password.match( /\d/g ) == null )
			return messages['password-err-number'];

		if ( password.match( /[A-Z]/g ) == null )
			return messages['password-err-letter-up'];

		if ( password.match( /[a-z]/g ) == null )
			return messages['password-err-letter-low'];

		return true;
	}
}

module.exports = Authentication;