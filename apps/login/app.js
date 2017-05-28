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
	if ( req.user ) {
		req.flash( 'warning', messages['already-logged-in'] );
		res.redirect( '/profile' );
	} else {
		res.render( 'index' );
	}
} );

app.post( '/', passport.authenticate( 'local', {
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
} ), function ( req, res ) {
	req.session.method = 'plain';
	if ( req.session.requestedUrl ) {
		res.redirect( req.session.requestedUrl );
		delete req.session.requestedUrl;
	} else {
		res.redirect( '/profile' );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
