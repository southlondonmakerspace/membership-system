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
	res.render( 'reset-password' );
} );

app.post( '/', function( req, res ) {
	Members.findOne( { email: req.body.email }, function( err, user ) {
		if ( user ) {
			crypto.randomBytes( 10, function( ex, code ) {
				var password_reset_code = code.toString( 'hex' );
				Members.update( { _id: user._id }, { $set: { password_reset_code: password_reset_code } }, function ( status ) {
					var message = {
						subject: 'Password Reset – ' + config.globals.organisation,
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
								name: 'USERNAME',
								content: user.username
							},
							{
								name: 'LINK',
								content: config.audience + '/password-reset/code/' + password_reset_code
							}
						]
					};

					mandrill_client.messages.sendTemplate( {
						template_name: 'password-reset',
						template_content: null,
						message: message
					}, function ( e ) {
					}, function ( e ) {
					} );
				} );
			} );
		}
		req.flash( 'success', 'If there is an account associated with the email address you will receive an email shortly' );
		res.redirect( '/password-reset' );
	} );
} );

app.get( '/code', function( req, res ) {
	res.render( 'change-password' );
} );

app.get( '/code/:password_reset_code', function( req, res ) {
	res.render( 'change-password', { password_reset_code: req.params.password_reset_code } );
} );

app.post( '/change-password', function( req, res ) {
	Members.findOne( { password_reset_code: req.body.password_reset_code }, function( err, user ) {
		if ( user ) {
			if ( req.body.password != req.body.verify ) {
				req.flash( 'danger', 'Passwords did not match' );
				res.redirect( '/password-reset/code/' + req.body.password_reset_code );
				return;
			}

			// Generate user salt
			crypto.randomBytes( 256, function( ex, salt ) {
				var password_salt = salt.toString( 'hex' );

				// Generate password hash
				crypto.pbkdf2( req.body.password, password_salt, 1000, 512, 'sha512', function( err, hash ) {
					var password_hash = hash.toString( 'hex' );
					Members.update( { _id: user._id }, { $set: {
						password_hash: password_hash,
						password_salt: password_salt,
						password_reset_code: null,
					} }, function( status ) {
						req.session.passport = { user: { _id: user._id } };
						req.flash( 'success', 'Password changed' );
						res.redirect( '/profile' );
					} );
				} );
			} );
		} else {
			req.flash( 'danger', 'Invalid password reset code' );
			res.redirect( '/login' );
		}
	} );
} );

module.exports = app;