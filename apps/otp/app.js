var __root = '../..';
var __src = __root + '/src';

var	express = require( 'express' ),
	app = express();

var	passport = require( 'passport' );

var messages = require( __src + '/messages.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( ! req.user.otp.activated ) {
		req.flash( 'warning', messages['2fa-unnecessary'] );
		res.redirect( '/profile/2fa' );
	} else if ( req.user.otp.activated && req.session.method === 'totp' ) {
		req.flash( 'warning', messages['2fa-already-complete'] );
		res.redirect( '/profile' );
	} else {
		res.render( 'index' );
	}
} );

app.post( '/', passport.authenticate( 'totp', {
	failureFlash: messages[ '2fa-invalid' ],
	failureRedirect: '/otp'
} ), function ( req, res ) {
	req.session.method = 'totp';
	if ( req.session.requestedUrl !== undefined ) {
		res.redirect( req.session.requestedUrl );
		delete req.session.requestedUrl;
	} else {
		res.redirect( '/profile' );
	}
} );

app.get( '/cancel', function( req, res ) {
	delete req.session.method;
	req.logout();
	res.redirect( '/' );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
