"use strict";

var	express = require( 'express' ),
	app = express();

var crypto = require( 'crypto' );

var	passport = require( 'passport' ),
	Members = require( '../../src/js/database' ).Members;

var LegacyMembers = require( '../../src/js/database' ).LegacyMembers,
	authentication = require( '../../src/js/authentication' );

app.set( 'views', __dirname + '/views' );

app.get( '/', migrationAuthenticated, function( req, res ) {
	req.user.firstname = req.user.name.split( ' ' )[0];
	req.user.lastname = req.user.name.split( ' ' )[1];
	res.render( 'migrate', { user: req.session.migration ? req.session.migration : req.user } );
	delete req.session.migration;
} );

app.post( '/', migrationAuthenticated, function( req, res ) {
	var user = {
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		address: req.body.address,
		tag_id: req.user.card_id,
		activated: true
	};

	if ( req.body.password != req.body.verify ) {
		req.flash( 'danger', 'Passwords did not match' );
		req.session.migration = user;
		res.redirect( '/migration' );
		return;
	}

	// Generate user salt
	crypto.randomBytes( 256, function( ex, salt ) {
		user.password_salt = salt.toString( 'hex' );

		// Generate password hash
		crypto.pbkdf2( req.body.password, user.password_salt, 1000, 512, 'sha512', function( err, hash ) {
			user.password_hash = hash.toString( 'hex' );

			// Store new member
			new Members( user ).save( function( status, user ) {
				if ( status != null && status.errors != undefined ) {
					var keys = Object.keys( status.errors );
					for ( var k in keys ) {
						var key = keys[k];
						req.flash( 'danger', status.errors[key].message );
					}
					req.session.migration = user;
					res.redirect( '/migration' );
				} else {
					LegacyMembers.update( { _id: req.user._id }, { $set: { migrated: true } }, function( status ) {
						console.log( status );
					} );
					req.session.passport = { user: { _id: user._id } };
					req.flash( 'success', 'Account migrated' );
					res.redirect( '/profile' );
				}
			} );
		} );
	} );
} );

module.exports = app;

function migrationAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() && req.user != undefined && req.user.migrated == false ) {
		return next();
	} else if ( req.isAuthenticated() ) {
		res.redirect( '/profile' );
		return;		
	}

	req.flash( 'error', 'Please login with Persona before migrating' );
	res.redirect( '/login' );
}