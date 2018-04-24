var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var Mail = require( __js + '/mail' );

var	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'index' );
} );

app.post( '/', function( req, res ) {
	if ( ! req.body.email ) {
		req.flash( 'danger', 'information-ommited' );
		res.redirect( app.mountpath );
		return;
	}
	Members.findOne( { email: req.body.email }, function( err, user ) {
		if ( user ) {
			auth.generateActivationCode( function( code ) {
				var password_reset_code = code;
				user.password.reset_code = password_reset_code;
				user.save( function( err ) {} );

				var options = {
					firstname: user.firstname,
					reset_url: config.audience + '/password-reset/code/' + password_reset_code
				};

				Mail.sendMail(
					req.body.email,
					'Password Reset',
					__dirname + '/email-templates/reset.text.pug',
					__dirname + '/email-templates/reset.html.pug',
					options,
					function() {
						req.flash( 'success', 'password-reset' );
						res.redirect( app.mountpath );
				} );
			} );
		} else {
			req.flash( 'success', 'password-reset' );
			res.redirect( app.mountpath );
		}
	} );
} );

app.get( '/code', function( req, res ) {
	res.render( 'change-password' );
} );

app.get( '/code/:password_reset_code', function( req, res ) {
	res.render( 'change-password', { password_reset_code: req.params.password_reset_code } );
} );

app.post( '/change-password', function( req, res ) {
	if ( ! req.body.password_reset_code ) {
		req.flash( 'danger', 'information-ommited' );
		res.redirect( app.mountpath );
		return;
	}
	Members.findOne( { 'password.reset_code': req.body.password_reset_code }, function( err, user ) {
		if ( user ) {
			if ( req.body.password != req.body.verify ) {
				req.flash( 'danger', 'password-err-mismatch' );
				res.redirect( app.mountpath + '/code/' + req.body.password_reset_code );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.password );
			if ( passwordRequirements !== true ) {
				req.flash( 'danger', passwordRequirements );
				res.redirect( app.mountpath + '/code/' + req.body.password_reset_code );
				return;
			}

			auth.generatePassword( req.body.password, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					'password.salt': password.salt,
					'password.hash': password.hash,
					'password.reset_code': null,
					'password.tries': 0,
					'password.iterations': password.iterations
				} }, function( status ) {
					req.login( user, function( err ) {
						req.flash( 'success', 'password-changed' );
						res.redirect( '/' );
					} );
				} );
			} );
		} else {
			req.flash( 'danger', 'password-reset-code-err' );
			res.redirect( '/login' );
		}
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
