var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var pug = require( 'pug' );
var nodemailer = require( 'nodemailer' );

var	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

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
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else {
		var user = {
			firstname: '',
			lastname: '',
			email: ''
		};
		res.render( 'join', { user: req.session.join ? req.session.join : user } );
		delete req.session.join;
	}
} );

app.post( '/', formBodyParser, function( req, res ) {
	if ( req.body.firstname === undefined ||
		 req.body.lastname === undefined ||
 		 req.body.password === undefined ||
 		 req.body.verify === undefined ||
 		 req.body.email === undefined ||
 		 req.body.address === undefined ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath );
 			return;
	}

	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else {
		var user = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			address: req.body.address,
		};

		if ( req.body.firstname === '' ) {
			req.flash( 'danger', messages['user-firstname'] );
			req.session.join = user;
			res.redirect( app.mountpath );
			return;
		}
		if ( req.body.lastname === '' ) {
			req.flash( 'danger', messages['user-lastname'] );
			req.session.join = user;
			res.redirect( app.mountpath );
			return;
		}
		if ( req.body.address === '' ) {
			req.flash( 'danger', messages['user-address'] );
			req.session.join = user;
			res.redirect( app.mountpath );
			return;
		}

		if ( req.body.password != req.body.verify ) {
			req.flash( 'danger', messages['password-err-mismatch'] );
			req.session.join = user;
			res.redirect( app.mountpath );
			return;
		}

		var passwordRequirements = auth.passwordRequirements( req.body.password );
		if ( passwordRequirements !== true ) {
			req.flash( 'danger', passwordRequirements );
			req.session.join = user;
			res.redirect( app.mountpath );
			return;
		}

		var postcode = '';
		var results = req.body.address.match( /([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)/ );

		if ( results !== undefined ) {
			postcode = results[0];
		}
		postcodes.lookup( postcode, function( err, data ) {
			if ( data !== undefined ) {
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
						if ( status !== null ) {
							if ( status.errors !== undefined ) {
								var keys = Object.keys( status.errors );
								for ( var k in keys ) {
									var key = keys[k];
									req.flash( 'danger', status.errors[key].message );
								}
							} else if ( status.code == 11000 ) {
								req.flash( 'danger', messages['duplicate-user'] );
							}
							req.session.join = user;
							res.redirect( app.mountpath );
						} else {
							var message = {};

							var options = {
								firstname: user.firstname,
								config: config,
								activation_url: config.audience + '/activate/' + user.activation_code
							};

							message.text = pug.renderFile( __dirname + '/email-templates/join.text.pug', options );
							message.html = pug.renderFile( __dirname + '/email-templates/join.html.pug', options );

							var transporter = nodemailer.createTransport( config.smtp.url );

							message.from = config.smtp.from;
							message.to = req.body.email;
							message.subject = 'Activation Email – ' + config.globals.organisation;

							req.flash( 'success', messages['account-created'] );
							res.redirect( '/' );

							transporter.sendMail( message, function( err, info ) {} );
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
