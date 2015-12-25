"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Members = require( './database' ).Members,
	ObjectId = require( 'mongoose' ).Schema.Types.ObjectId,
	crypto = require( 'crypto' );

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
							req.flash( 'success', 'Account created, please check your email for a registration link' );
							res.redirect( '/' );
							// Send an email
						}
					} );
				} );
			} );
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