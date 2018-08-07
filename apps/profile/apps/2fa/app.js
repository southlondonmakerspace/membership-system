var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var querystring = require('querystring');

var auth = require( __js + '/authentication' ),
	Options = require( __js + '/options' )();
const { wrapAsync } = require( __js + '/utils' );

var TOTP = require( 'notp' ).totp;
var base32 = require( 'thirty-two' );

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

app.get( '/setup', auth.isLoggedIn, wrapAsync( async function( req, res ) {
	if ( req.user.otp.activated ) {
		req.flash( 'danger', '2fa-already-enabled' );
		res.redirect( '/profile/2fa' );
		return;
	}

	const secret = await auth.generateOTPSecretPromise();

	await req.user.update( { $set: { 'otp.key': secret } } );

	const otpoptions = querystring.stringify( {
		issuer: ( ( config.dev ) ? ' [DEV] ' : '' ) + Options.getText( 'organisation' ),
		secret: secret
	} );
	const otpissuerName = encodeURIComponent( Options.getText( 'organisation' ) + ( ( config.dev ) ? '_dev' : '' ) );
	const otpauth = 'otpauth://totp/' + otpissuerName + ':' + req.user.email + '?' + otpoptions;
	const url = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent( otpauth );

	res.render( 'setup', {
		qr: url,
		secret: secret
	} );
} ) );

app.post( '/setup', auth.isLoggedIn, wrapAsync( async function( req, res ) {
	if ( req.user.otp.activated ) {
		req.flash( 'danger', '2fa-already-enabled' );
		res.redirect( '/profile/2fa' );
		return;
	}
	const test = TOTP.verify( req.body.code, base32.decode( req.user.otp.key ) );
	if ( test && Math.abs( test.delta ) < 2 ) {
		req.session.method = 'totp';

		await req.user.update({$set: {'otp.activated': true}});

		req.flash( 'success', '2fa-enabled' );
		res.redirect( '/profile/2fa' );
	} else {
		req.flash( 'danger', '2fa-setup-failed' );
		res.redirect( '/profile/2fa' );
	}
} ) );

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
				req.user.save( function() {
					req.flash( 'success', '2fa-disabled' );
					res.redirect( '/profile/2fa' );
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
