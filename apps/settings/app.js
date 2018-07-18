var express = require( 'express' ),
	app = express();

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
