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

		if ( ! req.body.firstname ) {
			req.flash( 'danger', 'user-firstname' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			return;
		}

		if ( ! req.body.lastname ) {
			req.flash( 'danger', 'user-lastname' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			return;
		}

		if ( req.body.password != req.body.verify ) {
			req.flash( 'danger', 'password-err-mismatch' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			return;
		}

		var passwordRequirements = auth.passwordRequirements( req.body.password );
		if ( passwordRequirements !== true ) {
			req.flash( 'danger', passwordRequirements );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			return;
		}

		if ( ! req.body.address ) {
			req.flash( 'danger', 'user-address' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
			return;
		}

		if ( req.body.address.split( '\n' ).length <= 2 ) {
			req.flash( 'danger', 'user-address' );
			req.session.joinForm = user;
			res.redirect( app.mountpath );
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
			return;
		}

		postcodes.lookup( postcode, function( err, data ) {
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
								}
							} else if ( status.code == 11000 ) {
								req.flash( 'danger', 'duplicate-user' );
							}
							res.redirect( app.mountpath );
						} else {
							var options = {
								firstname: user.firstname,
								activation_url: config.audience + '/activate/' + user.activation_code
							};

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
		} );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
