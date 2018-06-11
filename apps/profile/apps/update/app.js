var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Members = db.Members;

const { hasSchema } = require( __js + '/middleware' );
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
], async function( req, res ) {
	const { body: { email, firstname, lastname, delivery_optin, delivery_line1,
		delivery_line2, delivery_city, delivery_postcode }, user } = req;

	if ( email !== user.email ) {
		// TODO: update GoCardless email?
	}

	const profile = {
		email, firstname, lastname, delivery_optin,
		delivery_address: delivery_optin ? {
			line1: delivery_line1,
			line2: delivery_line2,
			city: delivery_city,
			postcode: delivery_postcode
		} : {}
	};

	try {
		await user.update( { $set: profile }, { runValidators: true } );

		req.log.info( {
			app: 'profile',
			action: 'update',
			sensitive: {
				profile: profile
			}
		} );

		req.flash( 'success', 'profile-updated' );
	} catch ( error ) {
		// Duplicate key error (on email)
		if ( error.code === 11000 ) {
			req.flash( 'danger', 'email-duplicate' );
		} else {
			req.flash( 'danger', 'validation-error-generic' );
		}
	}

	res.redirect( app.parent.mountpath + app.mountpath );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
