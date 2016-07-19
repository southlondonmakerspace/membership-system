"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var swig = require( 'swig' );
var nodemailer = require( 'nodemailer' );

var	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'reset-password' );
} );

app.post( '/', formBodyParser, function( req, res ) {
	if ( req.body.email == undefined ) {
		req.flash( 'danger', messages['password-reset-error'] );
		res.redirect( app.mountpath );
		return;
	}
	Members.findOne( { email: req.body.email }, function( err, user ) {
		if ( user ) {
			auth.generateActivationCode( function( code ) {
				var password_reset_code = code;
				user.password.reset_code = password_reset_code;
				user.save( function( err ) {} );

				var message = {};

				message.text = swig.renderFile( __dirname + '/email-templates/reset.swig', {
					firstname: user.firstname,
					organisation: config.globals.organisation,
					reset_url: config.audience + '/password-reset/code/' + password_reset_code
				} );

				var transporter = nodemailer.createTransport( config.smtp.url );

				message.from = config.smtp.from;
				message.to = user.email;
				message.subject = 'Password Reset – ' + config.globals.organisation;

				transporter.sendMail( message, function( err, info ) {
				} );
			} );
		}
		req.flash( 'success', messages['password-reset'] );
		res.redirect( app.mountpath );
	} );
} );

app.get( '/code', function( req, res ) {
	res.render( 'change-password' );
} );

app.get( '/code/:password_reset_code', function( req, res ) {
	res.render( 'change-password', { password_reset_code: req.params.password_reset_code } );
} );

app.post( '/change-password', formBodyParser, function( req, res ) {
	if ( req.body.email == undefined ) {
		req.flash( 'danger', messages['password-reset-error'] );
		res.redirect( app.mountpath );
		return;
	}
	Members.findOne( { 'password.reset_code': req.body.password_reset_code }, function( err, user ) {
		if ( user ) {
			if ( req.body.password != req.body.verify ) {
				req.flash( 'danger', messages['password-err-mismatch'] );
				res.redirect( app.mountpath + '/code/' + req.body.password_reset_code );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.password );
			if ( passwordRequirements != true ) {
				req.flash( 'danger', passwordRequirements );
				res.redirect( app.mountpath + '/code/' + req.body.password_reset_code );
				return;
			}

			auth.generatePassword( req.body.password, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					'password.salt': password.salt,
					'password.hash': password.hash,
					'password.reset_code': null,
				} }, function( status ) {
					req.session.passport = { user: { _id: user._id } };
					req.flash( 'success', messages['password-changed'] );
					res.redirect( '/profile' );
				} );
			} );
		} else {
			req.flash( 'danger', messages['password-reset-code-err'] );
			res.redirect( '/login' );
		}
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
