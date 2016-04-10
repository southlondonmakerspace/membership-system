"use strict";

var	express = require( 'express' ),
	app = express();

var	Members = require( '../../src/js/database' ).Members,
	authentication = require( '../../src/js/authentication' );

app.set( 'views', __dirname + '/views' );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'activate' );
	}
} );

app.get( '/:activation_code' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'You are logged in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'activate', { activation_code: req.params.activation_code } );
	}
} );

app.post( '/' , function( req, res ) {
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

			var password_hash = authentication.generatePassword( req.body.password, user.password_salt ).hash;

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
				req.session.passport = { user: { _id: user._id } };
				req.flash( 'success', 'You account is now active.' )
				res.redirect( '/profile' );
			} )
		} );
	}
} );

module.exports = app;