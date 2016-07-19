	"use strict";

var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	request= require( 'request' ),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var discourse = require( __js + '/discourse' ),
	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	// Not linked or in activation
	if ( ! req.user.discourse.activated && ! req.user.discourse.activation_code ) {
		var search = ( req.query.search ? req.query.search : req.user.email );
		discourse.searchUsers( search, function( users ) {
			if ( users != undefined ) {
				for ( var u in users ) {
					users[u].avatar = config.discourse.url + users[u].avatar_template.replace( '{size}', 100 );
					users[u].profile_link = config.discourse.url + '/users/' + users[u].username;
				}
			}
			res.render( 'find', { users: users, search: search } );
		} );
	// Linked, not activated
	} else if ( ! req.user.discourse.activated ) {
		res.render( 'activate', { activation_code: req.query.code } );

	// Linked
	} else if ( req.user.discourse.activated ) {
		discourse.getUserByEmail( req.user.discourse.email, function( user ) {
			user.avatar = config.discourse.url + user.avatar_template.replace( '{size}', 100 );
			res.render( 'linked', { discourse_user: user } );
		} );
	}
} );

app.post( '/link', [ formBodyParser, auth.isLoggedIn ], function( req, res ) {
	if ( req.body.search == undefined ) {
		req.flash( 'danger', messages['information-ommited'] );
		res.redirect( app.parent.mountpath );
		return;
	}
	if ( ! req.user.discourse.activation_code ) {
		discourse.searchUsers( req.body.search, function( users ) {
			if ( users != undefined ) {
				var user = users[ req.body.user ];
				console.log( user.id );
				Members.findOne( { "discourse.id": user.id }, function( err, member ) {
					if ( member ) {
						req.flash( 'warning', messages['discouse-id-duplicate'] );
						res.redirect( app.parent.mountpath + app.mountpath );
					} else {
						auth.generateActivationCode( function( code ) {
							code = code.toString( 'hex' );

							Members.update( { "_id": req.user._id }, { $set: {
								"discourse.id": user.id,
								"discourse.email": user.email,
								"discourse.activation_code": code
							} }, function ( error ) {} );

							discourse.sendActivationMessage( user.username, code );

							req.flash( 'info', messages['discourse-activation-sent'] );
							res.redirect( app.parent.mountpath );
						} );
					}
				} );
			}
		} );
	} else {
		req.flash( 'warning', messages['discourse-activation-dupe'] );
		res.redirect( app.parent.mountpath );
	}
} );

app.post( '/activate', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	if ( req.body.activation_code == undefined ) {
		req.flash( 'danger', messages['information-ommited'] );
		res.redirect( app.parent.mountpath );
		return;
	}
	if ( req.body.activation_code != '' ) {
		if ( req.body.activation_code == req.user.discourse.activation_code ) {
			Members.update( { "_id": req.user._id }, { $set: {
				"discourse.activated": true,
				"discourse.activation_code": null
			} }, function ( error ) {} );
			req.flash( 'info', messages['discourse-linked'] );
			return res.redirect( app.parent.mountpath + app.mountpath );
		}
	}
	req.flash( 'warning', messages['discourse-activation-code-err'] );
	res.redirect( app.parent.mountpath );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
