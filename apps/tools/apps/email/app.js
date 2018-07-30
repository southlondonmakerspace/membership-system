const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';

const express = require( 'express' );

const auth = require( __js + '/authentication' );

const app = express();

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isAdmin );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'email';
	next();
} );

app.get('/', (req, res) => {
	res.send({});
});


module.exports = function( config ) {
	app_config = config;
	return app;
};
