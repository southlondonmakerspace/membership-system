"use strict";

var	express = require( 'express' ),
	app = express(),
	passport = require( 'passport' ),
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.get( '/', ensureAuthenticated, function( req, res ) {
	res.render( 'profile', { user: req.user } );
} );

app.get( '/update', ensureAuthenticated, function( req, res ) {
	res.render( 'update', { user: req.user } );
} );

app.post( '/update', ensureAuthenticated, function( req, res ) {
	var profile = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		tag_id: req.body.tag_id,
		address: req.body.address
	};

	Members.update( { _id: req.user._id }, { $set: profile }, function( status ) {
		req.flash( 'success', 'Your profile has been updated' );
		res.redirect( '/profile' );
	} );
} );

module.exports = app;

function ensureAuthenticated( req, res, next ) {
	if ( req.isAuthenticated() ) {
		return next();
	}
	req.flash( 'error', 'Please login first' );
	res.redirect( '/login' );
}