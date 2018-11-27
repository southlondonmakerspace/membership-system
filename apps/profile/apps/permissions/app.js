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
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	res.render( 'index', { permissions: req.user.permissions } );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
