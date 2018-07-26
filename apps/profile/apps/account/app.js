var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

const auth = require( __js + '/authentication' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const { updateSchema } = require( './schemas.json' );
const { syncMemberDetails } = require( './utils' );

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
	const { body: { email, firstname, lastname }, user } = req;

	const needsSync = email !== user.email ||
		firstname !== user.firstname ||
		lastname !== user.lastname;

	if ( needsSync ) {
		const profile = { email, firstname, lastname };

		try {
			await user.update( { $set: profile }, { runValidators: true } );

			await syncMemberDetails( user, profile );

			req.log.info( {
				app: 'profile',
				action: 'update',
				sensitive: {
					profile: profile
				}
			} );

			req.flash( 'success', 'profile-updated' );
		} catch ( error ) {
			// Duplicate key (on email)
			if ( error.code === 11000 ) {
				req.flash( 'danger', 'email-duplicate' );
			} else {
				throw error;
			}
		}
	} else {
		req.flash( 'success', 'profile-updated' );
	}

	res.redirect( app.parent.mountpath + app.mountpath );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
