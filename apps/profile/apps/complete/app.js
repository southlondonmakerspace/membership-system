var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

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

app.post( '/', auth.isLoggedIn, function( req, res ) {
	// check password == verify etc.
	
	auth.generatePassword( req.body.password, function( password ) {
		req.user.update( { $set: {
			password,
			delivery_optin: req.body.delivery_optin === 'yes',
			delivery_address: {
				line1: req.body.address_line1,
				line2: req.body.address_line2,
				city: req.body.address_city,
				postcode: req.body.address_postcode,
			}
		} }, function () {
			res.redirect( '/profile' );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
