var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

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

app.get( '/revoke', auth.isLoggedIn, function( req, res ) {
	res.render( 'revoke' );
} );

app.post( '/revoke', auth.isLoggedIn, function( req, res ) {
	console.log( 'Revoking tag: ' + req.user.tag.id + ' for user: ' + req.user.email );
	req.user.tag.id = '';
	req.user.tag.hashed = '';
	req.user.save( function () {
		req.flash( 'danger', 'tag-revoked' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
