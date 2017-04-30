var __home = __dirname + "/../..";
var __config = __home + '/config/config.json';
var __src = __home + '/src';
var __js = __src + '/js';

var config = require( __config );

var db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	APIKeys = db.APIKeys;

var passport = require( 'passport' ),
	LocalStrategy = require( 'passport-local' ).Strategy,
	TotpStrategy = require( 'passport-totp' ).Strategy;

var crypto = require( 'crypto' ),
	base32 = require( 'thirty-two' );

var messages = require( __src + '/messages.json' );

var Authentication = {
	auth: function( app ) {

		// Add support for local authentication in Passport.js
		passport.use( new LocalStrategy( {
			usernameField: 'email'
		}, function( email, password, done ) {

				// Search for member by email address
				Members.findOne( { email: email }, function( err, user ) {
					// If a user is found validate password
					if ( user !== null ) {

						// Has account exceeded it's password tries?
						if ( user.password.tries >= config['password-tries'] ) {
							return done( null, false, { message: messages['account-locked'] } );
						}

						// Hash the entered password with the members salt
						Authentication.hashPassword( password, user.password.salt, function( hash ) {
							// Check the hashes match
							if ( hash == user.password.hash ) {

								// Check the user account is activated (or is a config superadmin)
								if ( ! ( user.activated || Authentication.superAdmin( user.email ) ) ) {
									return done( null, false, { message: messages['inactive-account'] } );
								}

								// Clear any pending password resets and notify
								if ( user.password.reset_code ) {
									user.password.reset_code = null;
									user.save( function ( err ) {} );
									return done( null, { _id: user._id }, { message: messages['password-reset-attempt'] } );
								}

								// Clear password tries and notify
								if ( user.password.tries > 0 ) {
									var attempts = user.password.tries;
									user.password.tries = 0;
									user.save( function ( err ) {} );
									return done( null, { _id: user._id }, { message: messages['account-attempts'].replace( '%', attempts ) } );
								}

								// Successful login
								return done( null, { _id: user._id }, { message: messages['logged-in'] } );
							} else {
								// If password doesn't match, increment tries and save
								user.password.tries++;
								user.save( function ( err ) {} );
								// Delay by 1 second to slow down password guessing
								return setTimeout( function() { return done( null, false, { message: messages['login-failed'] } ); }, 1000 );
							}
						} );
					} else {
						// If email address doesn't match
						// Delay by 1 second to slow down password guessing
						return setTimeout( function() { return done( null, false, { message: messages['login-failed'] } ); }, 1000 );
					}
				} );
			}
		) );

		// Add support for TOTP authentication in Passport.js
		passport.use( new TotpStrategy( {
			window: 1,
		}, function( user, done ) {
				if ( user.otp.key ) {
					return done( null, base32.decode( user.otp.key ), 30 );
				}
				return done( null, false );
			})
		);


		// Passport.js serialise user function
		passport.serializeUser( function( data, done ) {
			done( null, data );
		} );

		// Passport.js deserialise user function
		passport.deserializeUser( function( data, done ) {

			// Find member details and permissions
			Members.findById( data._id ).populate( 'permissions.permission' ).exec( function( err, user ) {

				// If member found
				if ( user !== null ) {

					// Create array of permissions for user
					var permissions = [ 'loggedIn' ];

					// Update last seen
					user.last_seen = new Date();
					user.save( function( err ) {} );

					// Add config superadmin permission if email address is in the config.json
					if ( Authentication.superAdmin( user.email ) )
						permissions.push( 'superadmin' );

					// Loop through permissions check they are active right now and add those to the array
					for ( var p = 0; p < user.permissions.length; p++ ) {
						if ( user.permissions[p].date_added <= new Date() ) {
							if ( ! user.permissions[p].date_expires || user.permissions[p].date_expires > new Date() ) {
								permissions.push( user.permissions[p].permission.slug );
							}
						}
					}

					user.quickPermissions = permissions;

					// Determin if user is still mid-setup
					user.setup = false;
					if ( user.emergency_contact.telephone ||
						 user.gocardless.mandate_id === '' ||
						 user.gocardless.subscription_id === '' ||
						 ! user.discourse.activated ||
						 user.discourse.username === '' ||
						 user.tag.id === '' )
						user.setup = true;

					// Return user data
					return done( null, user );
				} else {
					// Display login required message if user _id not found.
					return done( null, false, { message: messages['login-required'] } );
				}
			} );
		} );

		// Include support for passport and sessions
		app.use( passport.initialize() );
		app.use( passport.session() );
	},

	// Used for generating an OTP secret for 2FA
	// returns a base32 encoded string of random bytes
	generateOTPSecret: function( callback ) {
		crypto.randomBytes( 16, function( ex, raw ) {
			var secret = base32.encode( raw );
			secret = secret.toString().replace(/=/g, '');
			callback( secret );
		} );
	},

	// Used for generating activation codes for new accounts, discourse linking, and password reset
	// returns a 10 byte / 20 character hex string
	generateActivationCode: function( callback ) {
		crypto.randomBytes( 10, function( ex, code ) {
			callback( code.toString( 'hex' ) );
		} );
	},

	// Used to create a long salt for each individual user
	// returns a 256 byte / 512 character hex string
	generateSalt: function( callback ) {
		crypto.randomBytes( 256, function( ex, salt ) {
			callback( salt.toString( 'hex' ) );
		} );
	},

	// Hashes passwords through sha512 1000 times
	// returns a 512 byte / 1024 character hex string
	hashPassword: function( password, salt, callback ) {
		crypto.pbkdf2( password, salt, 1000, 512, 'sha512', function( err, hash ) {
			callback( hash.toString( 'hex' ) );
		} );
	},

	// Utility function generates a salt and hash from a plain text password
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

	// Checks if an email address is in the config.json superadmin email array
	superAdmin: function( email ) {
		if ( config.superadmins.indexOf( email ) != -1 ) {
			return true;
		}
		return false;
	},

	LOGGED_IN: true,
	NOT_LOGGED_IN: false,
	NOT_ACTIVATED: -1,
	NOT_MEMBER: -2,
	NOT_ADMIN: -3,
	REQUIRES_2FA: -4,

	// Checks the user is logged in and activated.
	loggedIn: function( req ) {
		// Is the user logged in?
		if ( req.isAuthenticated() && req.user ) {
			// Is the user active
			if ( req.user.activated || Authentication.superAdmin( req.user.email ) ) {
				if ( ! req.user.otp.key || ( req.user.otp.key && req.session.method == 'totp' ) ) {
					return Authentication.LOGGED_IN;
				} else {
					return Authentication.REQUIRES_2FA;
				}
			} else {
				return Authentication.NOT_ACTIVATED;
			}
		} else {
			return Authentication.NOT_LOGGED_IN;
		}
	},

	// Checks if the user is an active member (has paid or has admin powers)
	activeMember: function( req ) {
		// Check user is logged in
		var status = Authentication.loggedIn( req );
		if ( status != Authentication.LOGGED_IN ) {
			return status;
		} else {
			if ( Authentication.checkPermission( req, 'member' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.checkPermission( req, 'superadmin' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.checkPermission( req, 'admin' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.superAdmin( req.user.email ) ) return Authentication.LOGGED_IN;
		}
		return Authentication.NOT_MEMBER;
	},

	// Checks if the user has an active admin or superadmin privilage
	canAdmin: function( req ) {
		// Check user is logged in
		var status = Authentication.loggedIn( req );
		if ( status != Authentication.LOGGED_IN ) {
			return status;
		} else {
			if ( Authentication.checkPermission( req, 'superadmin' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.checkPermission( req, 'admin' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.superAdmin( req.user.email ) ) return Authentication.LOGGED_IN;
		}
		return Authentication.NOT_ADMIN;
	},

	// Checks if the user has an active superadmin privilage
	canSuperAdmin: function( req ) {
		// Check user is logged in
		var status = Authentication.loggedIn( req );
		if ( status != Authentication.LOGGED_IN ) {
			return status;
		} else {
			if ( Authentication.checkPermission( req, 'superadmin' ) ) return Authentication.LOGGED_IN;
			if ( Authentication.superAdmin( req.user.email ) ) return Authentication.LOGGED_IN;
		}
		return Authentication.NOT_ADMIN;
	},

	// Checks if the user has an active specified permission
	checkPermission: function( req, permission ) {
		if ( ! req.user ) return false;
		if ( permission == 'superadmin' ) {
			if ( Authentication.superAdmin( req.user.email ) ) return Authentication.LOGGED_IN;
			if ( req.user.quickPermissions.indexOf( config.permission.superadmin ) != -1 ) return Authentication.LOGGED_IN;
			return false;
		}
		if ( permission == 'admin' ) {
			if ( req.user.quickPermissions.indexOf( config.permission.admin ) != -1 ) return Authentication.LOGGED_IN;
			return false;
		}
		if ( req.user.quickPermissions.indexOf( permission ) != -1 ) return Authentication.LOGGED_IN;
		return false;
	},

	// Express middleware to redirect logged out users
	isLoggedIn: function( req, res, next ) {
		var status = Authentication.loggedIn( req );
		switch ( status ) {
			case Authentication.LOGGED_IN:
				return next();
			case Authentication.NOT_ACTIVATED:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case Authentication.REQUIRES_2FA:
				res.redirect( '/otp' );
				return;
			default:
			case Authentication.NOT_LOGGED_IN:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},

	// Express middleware to redirect unauthenticated API calls
	isAPIAuthenticated: function( req, res, next ) {
		if ( ! req.query.api_key ) return res.sendStatus( 403 );
		APIKeys.findOne( { key: req.query.api_key }, function( err, key ) {
			if ( key ) return next();
			return res.sendStatus( 403 );
		} );
	},

	// Express middleware to redirect inactive members
	isMember: function( req, res, next ) {
		var status = Authentication.activeMember( req );
		switch ( status ) {
			case Authentication.LOGGED_IN:
				return next();
			case Authentication.NOT_ACTIVATED:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case Authentication.NOT_MEMBER:
				req.flash( 'warning', messages['inactive-membership'] );
				res.redirect( '/profile' );
				return;
			case Authentication.REQUIRES_2FA:
				req.flash( 'warning', messages['2fa-required'] );
				res.redirect( '/otp' );
				return;
			default:
			case Authentication.NOT_LOGGED_IN:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},

	// Express middleware to redirect users without admin/superadmin privilages
	isAdmin: function( req, res, next ) {
		var status = Authentication.canAdmin( req );
		switch ( status ) {
			case Authentication.LOGGED_IN:
				return next();
			case Authentication.NOT_ACTIVATED:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case Authentication.NOT_MEMBER:
				req.flash( 'warning', messages['inactive-membership'] );
				res.redirect( '/profile' );
				return;
			case Authentication.NOT_ADMIN:
				req.flash( 'warning', messages['403'] );
				res.redirect( '/profile' );
				return;
			case Authentication.REQUIRES_2FA:
				req.flash( 'warning', messages['2fa-required'] );
				res.redirect( '/otp' );
				return;
			default:
			case Authentication.NOT_LOGGED_IN:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},

	// Express middleware to redirect users without superadmin privilages
	isSuperAdmin: function( req, res, next ) {
		var status = Authentication.canSuperAdmin( req );
		switch ( status ) {
			case Authentication.LOGGED_IN:
				return next();
			case Authentication.NOT_ACTIVATED:
				req.flash( 'warning', messages['inactive-account'] );
				res.redirect( '/' );
				return;
			case Authentication.NOT_MEMBER:
				req.flash( 'warning', messages['inactive-membership'] );
				res.redirect( '/profile' );
				return;
			case Authentication.NOT_ADMIN:
				req.flash( 'warning', messages['403'] );
				res.redirect( '/profile' );
				return;
			case Authentication.REQUIRES_2FA:
				req.flash( 'warning', messages['2fa-required'] );
				res.redirect( '/otp' );
				return;
			default:
			case Authentication.NOT_LOGGED_IN:
				if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
				req.flash( 'error', messages['login-required'] );
				res.redirect( '/login' );
				return;
		}
	},

	// Hashes a members tag with a salt using md5, per the legacy membership system
	hashCard: function( id ) {
		var md5 = crypto.createHash( 'md5' );
		md5.update( config.tag_salt );
		md5.update( id.toLowerCase() );
		return md5.digest( 'hex' );
	},

	// Checks password meets requirements
	passwordRequirements: function( password ) {
		if ( password.length < 8 )
			return messages['password-err-length'];

		if ( password.match( /\d/g ) === null )
			return messages['password-err-number'];

		if ( password.match( /[A-Z]/g ) === null )
			return messages['password-err-letter-up'];

		if ( password.match( /[a-z]/g ) === null )
			return messages['password-err-letter-low'];

		return true;
	}
};

module.exports = Authentication;
