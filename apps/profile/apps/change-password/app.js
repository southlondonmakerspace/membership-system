var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

const { wrapAsync } = require( __js + '/utils' );

const { hasSchema } = require( __js + '/middleware' );
const { changePasswordSchema } = require( './schemas.json' );

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
	res.render( 'index' );
} );

app.post( '/', [
	auth.isLoggedIn,
	hasSchema( changePasswordSchema ).orFlash
], wrapAsync( async function( req, res ) {
	const { body, user } = req;

	const hash = await auth.hashPasswordPromise( body.current, user.password.salt, user.password.iterations );

	if ( hash != user.password.hash ) {
		req.log.debug( {
			app: 'profile',
			action: 'change-password',
			error: 'Current password does not match users password',
		} );
		req.flash( 'danger', 'password-invalid' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	const password = await auth.generatePasswordPromise( body.new );

	await user.update( { $set: {
		'password.salt': password.salt,
		'password.hash': password.hash,
		'password.iterations': password.iterations,
		'password.reset_code': null,
	} } );

	req.log.info( {
		app: 'profile',
		action: 'change-password'
	} );

	req.flash( 'success', 'password-changed' );
	res.redirect( app.parent.mountpath + app.mountpath );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
