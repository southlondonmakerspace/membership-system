var	express = require( 'express' ),
	app = express();

const auth = require( __js + '/authentication' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const { updateSchema } = require( './schemas.json' );

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

app.post( '/', [
	auth.isLoggedIn,
	hasSchema(updateSchema).orFlash
], wrapAsync( async function( req, res ) {
	const { body: { delivery_optin, delivery_line1, delivery_line2, delivery_city,
		delivery_postcode }, user } = req;

	const profile = {
		delivery_optin,
		delivery_address: delivery_optin ? {
			line1: delivery_line1,
			line2: delivery_line2,
			city: delivery_city,
			postcode: delivery_postcode
		} : {}
	};

	await user.update( { $set: profile }, { runValidators: true } );

	req.log.info( {
		app: 'profile',
		action: 'update',
		sensitive: {
			profile: profile
		}
	} );

	req.flash( 'success', 'delivery-updated' );
	res.redirect( app.parent.mountpath + app.mountpath );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
