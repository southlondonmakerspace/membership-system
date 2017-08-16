var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var	passport = require( 'passport' );

var db = require( __js + '/database' ),
	Members = db.Members;

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'already-logged-in' );
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
	Members.findById( req.user, function( err, user ) {
		if ( user ) {
			req.session.method = 'plain';
			if ( user.otp.activated ) {
				res.redirect( '/otp' );
			} else {
				if ( req.session.requestedUrl ) {
					res.redirect( req.session.requestedUrl );
					delete req.session.requestedUrl;
				} else {
					res.redirect( '/profile' );
				}
			}
		} else {
			res.redirect( '/' );
		}
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
