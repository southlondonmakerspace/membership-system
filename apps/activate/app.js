"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var	Members = require( __js + '/database' ).Members,
	auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else {
		res.render( 'activate' );
	}
} );

app.get( '/:activation_code' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else if ( req.params.activation_code.match( /^\w{20}$/ ) == null ) {
		res.redirect( '/activate' );
	} else {
		res.render( 'activate', { activation_code: req.params.activation_code } );
	}
} );

app.post( '/', formBodyParser, function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else if ( req.body.activation_code.match( /^\w{20}$/ ) == null ) {
		req.flash( 'danger', messages['activation-error'] );
		res.redirect( '/activate' );
	} else {
		Members.findOne( {
			activation_code: req.body.activation_code,
		}, function ( err, user ) {
			
			if ( user == null ) {
				req.flash( 'danger', messages['activation-error'] );
				res.redirect( app.mountpath + '/' + req.body.activation_code );
				return;
			}

			auth.hashPassword( req.body.password, user.password.salt, function( hash ) {
				if ( user.password.hash != hash ) {
					req.flash( 'danger', messages['activation-error'] );
					res.redirect( app.mountpath + '/' + req.body.activation_code );
					return;
				}

				Members.update( {
					_id: user._id,
					'password.hash': hash
				}, {
					$set: {
						activation_code: null,
						activated: true
					}
				}, function ( status ) {
					req.session.passport = { user: { _id: user._id } };
					req.flash( 'success', messages['activation-success'] )
					res.redirect( '/profile' );
				} )
			} );
		} );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};