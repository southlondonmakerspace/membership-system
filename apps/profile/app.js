"use strict";

var	express = require( 'express' ),
	app = express();

var Members = require( '../../src/js/database' ).Members;

var messages = require( '../../src/messages.json' );

var config = require( '../../config/config.json' );

var auth = require( '../../src/js/authentication.js' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	Members.findById( req.user._id ).populate( 'permissions.permission' ).exec( function( err, user ) {
		res.render( 'profile', { user: user } );
	} )
} );

// Update Profile
/////////////////

app.get( '/update', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Update"
	} );
	res.render( 'update', { user: req.user } );
} );

app.post( '/update', auth.isLoggedIn, function( req, res ) {
	var profile = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
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
			req.flash( 'success', messages['profile-updated'] );
		}
		res.redirect( app.mountpath );
	} );
} );

// Emergency Contact
////////////////////

app.get( '/emergency-contact', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Emergency contact"
	} );
	res.render( 'emergency-contact', { user: req.user } );
} );

app.post( '/emergency-contact', auth.isLoggedIn, function( req, res ) {
	var profile = {
		emergency_contact: {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			telephone: req.body.telephone
		}
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status != null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', messages['emergency-contact-updated'] );
		}
		res.redirect( app.mountpath );
	} );
} );

// Tag
//////

app.get( '/tag', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Tag"
	} );
	res.render( 'tag', { user: req.user } );
} );

app.post( '/tag', auth.isLoggedIn, function( req, res ) {
	var hashed_tag = auth.hashCard( req.body.tag );
	var profile = {
		'tag.id': req.body.tag,
		'tag.hashed': hashed_tag
	};

	if ( req.body.tag == '' )
		profile['tag.hashed'] = '';

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status != null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', messages["tag-updated"] );
		}
		res.redirect( app.mountpath + '/tag' );
	} );
} );

// Change Password
//////////////////

app.get( '/change-password', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Change Password"
	} );
	res.render( 'change-password' );
} );

app.post( '/change-password', auth.isLoggedIn, function( req, res ) {
	Members.findOne( { _id: req.user._id }, function( err, user ) {
		auth.hashPassword( req.body.current, user.password.salt, function( hash ) {
			if ( hash != user.password.hash ) {
				req.flash( 'danger', messages['password-invalid'] );
				res.redirect( app.mountpath + '/change-password' );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.new );
			if ( passwordRequirements != true ) {
				req.flash( 'danger', passwordRequirements );
				res.redirect( app.mountpath + '/change-password' );
				return;
			}

			if ( req.body.new != req.body.verify ) {
				req.flash( 'danger', messages['password-mismatch'] );
				res.redirect( app.mountpath + '/change-password' );
				return;
			}

			auth.generatePassword( req.body.new, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					'password.salt': password.salt,
					'password.hash': password.hash,
					'password.reset_code': null,
				} }, function( status ) {
					req.flash( 'success', messages['password-changed'] );
					res.redirect( app.mountpath );
				} );
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};