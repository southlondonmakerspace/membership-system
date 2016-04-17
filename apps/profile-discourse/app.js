	"use strict";

var	express = require( 'express' ),
	app = express(),
	request= require( 'request' );

var config = require( '../../config/config.json' );

var Members = require( '../../src/js/database' ).Members;

var crypto = require( 'crypto' );

var auth = require( '../../src/js/authentication.js' );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Discourse",
		url: "/discourse"
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	// Not linked or in activation
	if ( ! req.user.discourse.activation_code ) {
		findDiscourseUserByEmail( req.user.email, function( user ) {
			if ( user != undefined ) {
				Members.update( { "_id": req.user._id }, { $set: {
					"discourse.id": user.id,
					"discourse.email": req.user.email
				} }, function( err ) {
				} );

				user.avatar = config.discourse.url + user.avatar_template.replace( '{size}', 100 );
			}
			res.render( 'find', { discourse_user: user } );
		} );
	// Linked, not activated
	} else if ( ! req.user.discourse.activated && req.user.discourse.id ) {
		res.render( 'activate', { activation_code: req.query.code } );

	// Linked 
	} else if ( req.user.discourse.activated ) {
		findDiscourseUserByEmail( req.user.discourse.email, function( user ) {
			user.avatar = config.discourse.url + user.avatar_template.replace( '{size}', 100 );
			res.render( 'linked', { discourse_user: user } );
		} );
	}
} );

app.post( '/link', auth.isLoggedIn, function( req, res ) {
	if ( ! req.user.discourse.activation_code ) {
		crypto.randomBytes( 10, function( ex, code ) {
			code = code.toString( 'hex' );
			
			Members.update( { "_id": req.user._id }, { $set: {
				"discourse.activation_code": code
			} }, function ( error ) {} );

			findDiscourseUserByEmail( req.user.discourse.email, function ( user ) {
				sendDiscourseActivationMessage( user.username, code );
			} );
			
			req.flash( 'info', 'Activation code sent to your Discourse private messages' );
		} );
	} else {
		req.flash( 'warning', 'Activation code has already been sent' );
	}
	res.redirect( '/profile/discourse' );
} );

app.post( '/activate', auth.isLoggedIn, function( req, res ) {
	if ( req.body.activation_code != '' ) {
		if ( req.body.activation_code == req.user.discourse.activation_code ) {
			Members.update( { "_id": req.user._id }, { $set: {
				"discourse.activated": true
			} }, function ( error ) {} );
			req.flash( 'info', 'Discourse user linked' );
			return res.redirect( '/profile/discourse' );
		}
	}
	req.flash( 'warning', 'You must enter a valid activation code' );
	res.redirect( '/profile/discourse' );
} );

function findDiscourseUserByEmail( email, callback ) {
	request.get( config.discourse.url + '/admin/users/list/active.json', {
		form: {
			api_username: config.discourse.api_username,
			api_key: config.discourse.api_key,
			show_emails: true,
			filter: email
		}
	}, function ( error, response, body ) {
		if ( response.statusCode == '200 ') {
			var output = JSON.parse( body );
			if ( output[0] != undefined ) {
				return callback( output[0] );
			}
		}
		return callback();
	} );
}

function sendDiscourseActivationMessage( username, code ) {
	var message = "Your activation code: **" + code + "**\n\n[Click here to activate](" + config.audience + '/profile/discourse?code=' + code + ")";

	request.post( config.discourse.url + '/posts', {
		form: {
			api_username: config.discourse.api_username,
			api_key: config.discourse.api_key,
			raw: message,
			title: "Activation Code",
			category: "",
			is_warning: "false",
			archetype: "private_message",
			target_usernames: username,
			nested_post: "true"
		}
	} );
}

module.exports = app;

// PUT /groups/41/members.json (FORM: usernames: *)
// DELETE /groups/41/members.json (FORM: user_id: *)