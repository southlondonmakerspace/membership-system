"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Members = require( '../../src/js/database' ).Members;

var crypto = require( 'crypto' );

var authentication = require( '../../src/js/authentication' );

app.set( 'views', __dirname + '/views' );

app.get( '/', ensureAuthenticated, function( req, res ) {
	if ( req.session.requested ) {
		res.redirect( req.session.requested );
		delete req.session.requested;
		return;
	}
	Members.findById( req.user._id ).populate( 'permissions.permission' ).exec( function( err, user ) {
		res.render( 'profile', { user: user } );
	} )
} );

app.get( '/update', ensureAuthenticated, function( req, res ) {
	res.render( 'update', { user: req.user } );
} );

app.post( '/update', ensureAuthenticated, function( req, res ) {
	var profile = {
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		tag_id: req.body.tag_id,
		address: req.body.address
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status != null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', 'Your profile has been updated' );
		}
		res.redirect( '/profile' );
	} );
} );

app.get( '/change-password', ensureAuthenticated, function( req, res ) {
	res.render( 'change-password' );
} );

app.post( '/change-password', ensureAuthenticated, function( req, res ) {
	Members.findOne( { _id: req.user._id }, function( err, user ) {
		var password_hash = authentication.generatePassword( req.body.current, user.password_salt ).hash;
		if ( password_hash != user.password_hash ) {
			req.flash( 'danger', 'Current password is wrong' );
			res.redirect( '/profile/change-password' );
			return;
		}

		if ( req.body.new != req.body.verify ) {
			req.flash( 'danger', 'Passwords did not match' );
			res.redirect( '/profile/change-password' );
			return;
		}

		// Generate user salt
		crypto.randomBytes( 256, function( ex, salt ) {
			var password_salt = salt.toString( 'hex' );

			// Generate password hash
			crypto.pbkdf2( req.body.new, password_salt, 1000, 512, 'sha512', function( err, hash ) {
				var password_hash = hash.toString( 'hex' );
				Members.update( { _id: user._id }, { $set: {
					password_hash: password_hash,
					password_salt: password_salt,
					password_reset_code: null,
				} }, function( status ) {
					req.flash( 'success', 'Password changed' );
					res.redirect( '/profile' );
				} );
			} );
		} );
	} );
} );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() && req.user != undefined && req.user.migrated == null ) {
		return next();
	} else if ( req.isAuthenticated() ) {
		res.redirect( '/migration' );
		return;		
	}

	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}