var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'index', {
		mandate: ( req.user.gocardless.mandate_id ? true : false ),
		subscription: ( req.user.gocardless.subscription_id ? true : false ),
		member: ( auth.checkPermission( req, 'member' ) ? true : false )
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
