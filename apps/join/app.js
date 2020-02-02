var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var Mail = require( __js + '/mail' );

var	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'already-logged-in' );
		res.redirect( '/profile' );
	} else {
		var user = {
			firstname: '',
			lastname: '',
			email: ''
		};
		if ( req.session.joinForm ) {
			user = req.session.joinForm;
			delete req.session.joinForm;
		}
		res.render( 'index', { user: user } );
	}
} );

app.post( '/', function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'already-logged-in' );
		res.redirect( '/profile' );
	} else {
		var user = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			address: req.body.address,
		};

		if ( ! req.body.email ) {
			req.flash( 'danger', 'user-email' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Email address not provided.'
			} );
			return;
		} else {
			req.body.email = req.body.email.toLowerCase();
		}

		if ( ! req.body.firstname ) {
			req.flash( 'danger', 'user-firstname' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'First name not provided.'
			} );
			return;
		}

		if ( ! req.body.lastname ) {
			req.flash( 'danger', 'user-lastname' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Last name not provided.'
			} );
			return;
		}

		if ( req.body.password != req.body.verify ) {
			req.flash( 'danger', 'password-mismatch' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Passwords did not match.'
			} );
			return;
		}

		var passwordRequirements = auth.passwordRequirements( req.body.password );
		if ( passwordRequirements !== true ) {
			req.flash( 'danger', passwordRequirements );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Passwords did not meet password requirements: ' + passwordRequirements
			} );
			return;
		}

		if ( ! req.body.address ) {
			req.flash( 'danger', 'user-address' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Address not provided.'
			} );
			return;
		}

		if ( req.body.address.split( '\n' ).length <= 2 ) {
			req.flash( 'danger', 'user-address' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Address does not have enough lines.'
			} );
			return;
		}

		var postcode;
		var results = req.body.address.match( /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/ );

		if ( results ) {
			postcode = results[0];
		}

		if ( ! postcode ) {
			req.flash( 'danger', 'user-postcode' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Address does not have a valid postcode.'
			} );
			return;
		}

		postcodes.lookup( postcode ).then( function( data ) {
			if ( data ) {
				user.postcode_coordinates = {
					lat: data.latitude,
					lng: data.longitude,
				};
			} else {
				user.postcode_coordinates = null;
			}

			// Generate email code salt
			auth.generateActivationCode( function( code ) {
				user.activation_code = code;

				auth.generatePassword( req.body.password, function( password ) {
					user.password = password;

					// Store new member
					new Members( user ).save( function( status ) {
						if ( status ) {
							if ( status.errors ) {
								var keys = Object.keys( status.errors );
								for ( var k in keys ) {
									var key = keys[k];
									req.flash( 'danger', status.errors[key].message );
									req.log.debug( {
										app: 'join',
										action: 'signup',
										error: "Mongo schema validation error: " + status.error[key].message
									} );
								}
							} else if ( status.code == 11000 ) {
								req.flash( 'danger', 'user-duplicate' );
								req.log.debug( {
									app: 'join',
									action: 'signup',
									error: 'User account already exists.'
								} );
							}
							res.redirect( app.mountpath );
							return;
						} else {
							var options = {
								firstname: user.firstname,
								activation_url: config.audience + '/activate/' + user.activation_code
							};

							req.log.info( {
								app: 'join',
								action: 'signup',
								sensitive: {
									user: {
										firstname: user.firstname,
										lastname: user.lastname,
										email: user.email,
										activation_code: user.activation_code
									}
								}
							} );

							Mail.sendMail(
								req.body.email,
								'Activation Email',
								__dirname + '/email-templates/join.text.pug',
								__dirname + '/email-templates/join.html.pug',
								options,
								function() {
									req.flash( 'success', 'account-created' );
									res.redirect( '/' );
							} );
						}
					} );
				} );
			} );
		}, function( error ) {
			req.log.debug( {
				app: 'join',
				action: 'error-lookingup-postcode',
				error: error
			} );
			req.flash( 'danger', 'user-postcode' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
		} );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
