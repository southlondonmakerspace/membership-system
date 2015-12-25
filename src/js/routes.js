"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' );

var Members = require( './database' ).Members,
	ObjectId = require( 'mongoose' ).Schema.Types.ObjectId;

var crypto = require( 'crypto' );

var config = require( '../../config/config.json' );

var mandrill = require( 'mandrill-api/mandrill' ),
	mandrill_client = new mandrill.Mandrill( config.mandrill.api_key );

app.set( 'views', __dirname + '/../views' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( '/login' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are already logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'login' );
	}
} );

app.post( '/login', passport.authenticate( 'persona', { failureRedirect: '/login' } ), function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are already logged in' );
		res.redirect( '/profile' );
	} else {
		res.redirect( '/migration' );
	}
} );

app.get( '/migration', ensureAuthenticated, function( req, res ) {
	// Needs to go off and access legacy document collection
	res.render( 'migrate', { legacy: req.user } );
} );

app.post( '/migration', ensureAuthenticated, function( req, res ) {
	// Needs to create new user and mark legacy document as migrated to prevent repeats
	req.flash( 'info', 'This is where migration would occur' );
	res.redirect( '/profile' );
} );

app.get( '/join' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'join', { user: req.session.join } );
		delete req.session.join;
	}
} );

app.post( '/join', function( req, res ) {
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
							// Send an email
						}
					} );
				} );
			} );
		} );
	}
} );

app.get( '/activate' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'activate' );
	}
} );

app.get( '/activate/:activation_code' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'activate', { activation_code: req.params.activation_code } );
	}
} );

app.post( '/activate' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		Members.findOne( {
			activation_code: req.body.activation_code,
		}, function ( err, user ) {
			
			if ( user == null ) {
				req.flash( 'danger', 'Activation code or password did not match' );
				res.redirect( '/activate/' + req.body.activation_code );
				return;
			}

			var password_hash = generatePassword( req.body.password, user.password_salt ).hash;

			if ( user.password_hash != password_hash ) {
				req.flash( 'danger', 'Activation code or password did not match' );
				res.redirect( '/activate/' + req.body.activation_code );
				return;
			}

			Members.update( {
				_id: user._id,
				password_hash: password_hash
			}, {
				$set: {
					activated: true
				}
			}, function ( status ) {
				console.log( status );
				req.flash( 'success', 'You account is now active, please login' )
				res.redirect( '/login' );
			} )
		} );
	}
} );

app.get( '/password-reset' , function( req, res ) {
	res.render( 'reset-password' );
} );

app.post( '/password-reset', function( req, res ) {
	res.redirect( '/' );
} );

app.get( '/logout', function( req, res ) {
	req.logout();
	req.flash( 'success', 'Logged out' );
	res.redirect( '/' );
} );

app.post( '/auth/browserid', passport.authenticate( 'persona', {
	failureRedirect: '/login',
	successRedirect: '/profile',
	failureFlash: true,
	successFlash: true
} ) );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() ) {
		return next();
	}

	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}

function generatePassword( password, salt ) {
	if ( ! salt ) salt = crypto.randomBytes( 256 ).toString( 'hex' );
	var hash = crypto.pbkdf2Sync( password, salt, 1000, 512, 'sha512' ).toString( 'hex' )
	return {
		salt: salt,
		hash: hash
	};
}