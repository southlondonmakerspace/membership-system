"use strict";

var	express = require( 'express' ),
	app = express();

var swig = require( 'swig' );
var nodemailer = require( 'nodemailer' );

var	Members = require( '../../src/js/database' ).Members;

var crypto = require( 'crypto' );

var config = require( '../../config/config.json' );

app.set( 'views', __dirname + '/views' );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'join', { user: req.session.join } );
		delete req.session.join;
	}
} );

app.post( '/', function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		var user = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			address: req.body.address,
		};

		if ( req.body.password != req.body.verify ) {
			req.flash( 'danger', 'Passwords did not match' );
			req.session.join = user;
			res.redirect( '/join' );
			return;
		}

		// Generate email code salt
		crypto.randomBytes( 10, function( ex, code ) {
			user.activation_code = code.toString( 'hex' );

			// Generate user salt
			crypto.randomBytes( 256, function( ex, salt ) {
				user.password_salt = salt.toString( 'hex' );

				// Generate password hash
				crypto.pbkdf2( req.body.password, user.password_salt, 1000, 512, 'sha512', function( err, hash ) {
					user.password_hash = hash.toString( 'hex' );

					// Store new member
					new Members( user ).save( function( status ) {
						if ( status != null && status.errors != undefined ) {
							var keys = Object.keys( status.errors );
							for ( var k in keys ) {
								var key = keys[k];
								req.flash( 'danger', status.errors[key].message );
							}
							req.session.join = user;
							res.redirect( '/join' );
						} else {
							var message = {};
							
							message.text = swig.renderFile( __dirname + '/email-templates/join.swig', {
								firstname: req.body.firstname,
								organisation: config.globals.organisation,
								activation_url: config.audience + '/activate/' + user.activation_code
							} );

							var transporter = nodemailer.createTransport( config.smtp.url );

							message.from = config.smtp.from;
							message.to = req.body.email;
							message.subject = 'Activation Email – ' + config.globals.organisation;
							
							transporter.sendMail( message, function( err, info ) {
								if ( err ) {
									req.flash( 'warning', 'Account created, system was unable to send activation email, please contact the administrator' );
									res.redirect( '/' );
								} else {
									req.flash( 'success', 'Account created, please check your email for a registration link' );
									res.redirect( '/' );
								}
							} );
						}
					} );
				} );
			} );
		} );
	}
} );

module.exports = app;