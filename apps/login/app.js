const express = require( 'express' );
const passport = require( 'passport' );

const { Members } = require( __js + '/database' );
const { wrapAsync } = require ( __js + '/utils' );

const app = express();
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

app.get( '/:code', wrapAsync( async function( req, res ) {
	const member = await Members.findOne( {
		'loginOverride.code': req.params.code,
		'loginOverride.expires': {$gt: new Date()}
	} );

	if (member) {
		await member.update({$unset: {loginOverride: 1}});

		req.login(member, function ( loginError ) {
			if ( loginError ) {
				throw loginError;
			}
			res.redirect('/profile');
		});
	} else {
		req.flash('error', 'login-code-invalid');
		res.redirect( '/login' );
	}
} ) );

app.post( '/', passport.authenticate( 'local', {
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
} ), wrapAsync( async function ( req, res ) {
	const user = await Members.findById( req.user );
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
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
