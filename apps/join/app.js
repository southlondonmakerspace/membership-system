"use strict";

var	express = require( 'express' ),
	app = express();

var	passport = require( 'passport' ),
	Members = require( '../../src/js/database' ).Members;

var crypto = require( 'crypto' );

var config = require( '../../config/config.json' );

var mandrill = require( 'mandrill-api/mandrill' ),
	mandrill_client = new mandrill.Mandrill( config.mandrill.api_key );

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
			username: req.body.username,
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
							var message = {
								subject: 'Activation Email – ' + config.globals.organisation,
								from_email: config.mandrill.from_email,
								from_name: config.mandrill.from_name,
								to: [ {
									email: user.email,
									name: user.firstname + ' ' + user.lastname,
								} ],
								track_opens: true,
								track_clicks: true,
								global_merge_vars: [
									{
										name: 'NAME',
										content: user.firstname
									},
									{
										name: 'LINK',
										content: config.audience + '/activate/' + user.activation_code
									}
								]
							};

							mandrill_client.messages.sendTemplate( {
								template_name: 'activation-email',
								template_content: null,
								message: message
							}, function ( e ) {
								req.flash( 'success', 'Account created, please check your email for a registration link' );
								res.redirect( '/' );
							}, function ( e ) {
								req.flash( 'danger', 'Your account was created, but there was a problem sending the activation email, please contact: ' + config.mandrill.from_name );
								res.redirect( '/' );
								console.log( e );
							} );
						}
					} );
				} );
			} );
		} );
	}
} );

module.exports = app;