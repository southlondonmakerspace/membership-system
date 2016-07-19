"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';
var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var Members = require( __js + '/database' ).Members;

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' );

var apps = [];
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

app.post( '/update', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	if ( req.body.firstname == undefined ||
		 req.body.lastname == undefined ||
 		 req.body.email == undefined ||
 		 req.body.address == undefined ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath );
 			return;
	}
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

app.post( '/emergency-contact', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	if ( req.body.firstname == undefined ||
		 req.body.lastname == undefined ||
 		 req.body.telephone == undefined ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath );
 			return;
	}
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

app.post( '/tag', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	if ( req.body.tag == undefined ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath );
 			return;
	}
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
		res.redirect( app.mountpath );
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

app.post( '/change-password', [ auth.isLoggedIn, formBodyParser ], function( req, res ) {
	if ( req.body.current == undefined ||
		 req.body.new == undefined ||
 		 req.body.verify == undefined ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath );
 			return;
	}
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

function loadApps() {
	var files = fs.readdirSync( __apps );
	for ( var f in files ) {
		var file = __apps + '/' + files[f];
		if ( fs.statSync( file ).isDirectory() ) {
			var config_file = file + '/config.json';
			if ( fs.existsSync( config_file ) ) {
				var output = JSON.parse( fs.readFileSync( config_file ) );
				output.uid = files[f];
				if ( output.priority == undefined )
					output.priority = 100;
				output.app = file + '/app.js';
				apps.push( output );
			}
		}
	}

	for ( var a in apps ) {
		var _app = apps[a];
		console.log( "	  Sub route: /" + _app.path );
		app.use( '/' + _app.path, require( _app.app )( _app ) );
	}
}

module.exports = function( config ) {
	app_config = config;
	loadApps();
	return app;
};
