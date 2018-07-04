const __root = '../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const config = require( __config + '/config.json' );

const express = require( 'express' );
const moment = require( 'moment' );

const auth = require( __js + '/authentication' );

const app = express();
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;

	if ( req.user && !req.user.setupComplete && req.originalUrl !== '/profile/complete') {
		res.redirect('/profile/complete');
	} else {
		next();
	}

} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	const { user } = req;

	if ( auth.activeMember( req ) ) {
		let membership_expires;

		if ( user.memberPermission ) {
			const expires = moment( user.memberPermission.date_expires );

			// If we're in the grace period assume payment has gone through
			if ( expires.subtract( config.gracePeriod ).isBefore() ) {
				membership_expires = expires; // TODO: calculate next payment date
			} else {
				membership_expires = expires;
			}
		}

		res.render( 'profile', {
			user: req.user,
			membership_expires
		} );
	} else {
		res.render( 'profile', { user: req.user } );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
