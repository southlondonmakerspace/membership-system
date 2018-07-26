var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

const { completeSchema } = require( './schemas.json' );
const { hasSchema } = require( __js + '/middleware' );

var auth = require( __js + '/authentication' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	if ( req.user.setupComplete ) {
		res.redirect( '/profile' );
	} else {
		res.locals.app = app_config;
		res.locals.breadcrumb.push( {
			name: app_config.title,
			url: app.parent.mountpath + app.mountpath
		} );
		res.locals.activeApp = app_config.uid;
		next();
	}
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'complete', { user: req.user } );
} );

app.post( '/', [
	auth.isLoggedIn,
	hasSchema(completeSchema).orFlash
], function( req, res ) {
	const { body : { password, delivery_optin, delivery_line1, delivery_line2,
		delivery_city, delivery_postcode, reason }, user } = req;

	auth.generatePassword( password, function( password ) {
		user.update( { $set: {
			password, delivery_optin,
			delivery_address: delivery_optin ? {
				line1: delivery_line1,
				line2: delivery_line2,
				city: delivery_city,
				postcode: delivery_postcode
			} : {},
			join_reason: reason
		} }, function () {
			res.redirect( '/profile' );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
