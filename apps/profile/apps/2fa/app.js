var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var querystring = require("querystring");

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	Options = require( __js + '/options' )();

var TOTP = require( 'notp' ).totp;
var base32 = require( 'thirty-two' );

var Mail = require( __js + '/mail' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'index', { user: req.user } );
} );

app.get( '/setup', auth.isLoggedIn, function( req, res ) {
	if ( req.user.otp.activated ) {
		req.flash( 'danger', '2fa-already-enabled' );
		res.redirect( '/profile/2fa' );
		return;
	}
	auth.generateOTPSecret( function( secret ) {
		req.user.otp.key = secret;
		req.user.save( function( err ) {
			var otpoptions = querystring.stringify( {
					 issuer: ( ( config.dev ) ? ' [DEV] ' : '' ) + Options.getText( 'organisation' ),
					 secret: secret
			 } );
			 var otpissuerName = encodeURIComponent( Options.getText( 'organisation' ) + ( ( config.dev ) ? '_dev' : '' ) );
			var otpauth = 'otpauth://totp/' + otpissuerName + ':' + req.user.email + '?' + otpoptions
			var url = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent( otpauth );
			res.render( 'setup', {
				qr: url,
				secret: secret
			} );
		} );
	} );
} );

app.post( '/setup', auth.isLoggedIn, function( req, res ) {
	if ( req.user.otp.activated ) {
		req.flash( 'danger', '2fa-already-enabled' );
		res.redirect( '/profile/2fa' );
		return;
	}
	var test = TOTP.verify( req.body.code, base32.decode( req.user.otp.key ) );
	if ( test && Math.abs( test.delta ) < 2 ) {
		req.user.otp.activated = true;
		req.session.method = 'totp';
		req.user.save( function( err ) {
			var options = {
				firstname: req.user.firstname
			};

			Mail.sendMail(
				req.user.email,
				'Two Factor Authentaction Enabled',
				__dirname + '/email-templates/enabled.text.pug',
				__dirname + '/email-templates/enabled.html.pug',
				options,
				function() {
					req.flash( 'success', '2fa-enabled' );
					res.redirect( '/profile/2fa' );
			} );
		} );
	} else {
		req.flash( 'danger', '2fa-setup-failed' );
		res.redirect( '/profile/2fa' );
	}
} );

app.get( '/disable', auth.isLoggedIn, function( req, res ) {
	if ( req.user.otp.activated ) {
		res.render( 'disable' );
	} else {
		req.flash( 'warning', '2fa-already-disabled' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/disable', auth.isLoggedIn, function( req, res ) {
	// Check OTP
	var test = TOTP.verify( req.body.code, base32.decode( req.user.otp.key ) );
	if ( test && Math.abs( test.delta ) < 2 ) {
		// Check password
		auth.hashPassword( req.body.password, req.user.password.salt, req.user.password.iterations, function( hash ) {
			// Check the hashes match
			if ( hash == req.user.password.hash ) {
				req.user.otp.activated = false;
				req.user.otp.key = '';
				req.user.save( function( err ) {
					var options = {
						firstname: req.user.firstname
					};

					Mail.sendMail(
						req.user.email,
						'Two Factor Authentaction Disabled',
						__dirname + '/email-templates/disabled.text.pug',
						__dirname + '/email-templates/disabled.html.pug',
						options,
						function() {
							req.flash( 'success', '2fa-disabled' );
							res.redirect( '/profile/2fa' );
					} );
				} );
			} else {
				req.flash( 'warning', '2fa-unable-to-disable' );
				res.redirect( '/profile/2fa/disable' );
			}
		} );
	} else {
		req.flash( 'warning', '2fa-unable-to-disable' );
		res.redirect( '/profile/2fa/disable' );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
