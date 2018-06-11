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

const updateSchema = {
	body: {
		type: 'object',
		required: ['email', 'firstname', 'lastname', 'delivery_optin'],
		properties: {
			email: {
				type: 'string'
			},
			firstname: {
				type: 'string'
			},
			lastname: {
				type: 'string'
			}
		},
		oneOf: [
			{
				required: ['delivery_line1', 'delivery_city', 'delivery_postcode'],
				properties: {
					delivery_optin: {
						const: true
					},
					delivery_line1: {
						type: 'string'
					},
					delivery_line2: {
						type: 'string'
					},
					delivery_city: {
						type: 'string'
					},
					delivery_postcode: {
						type: 'string'
					}
				}
			},
			{
				properties: {
					delivery_optin: {
						const: false
					}
				}
			}
		]
	}
}

app.post( '/', auth.isLoggedIn, async function( req, res ) {
	const { body: { email, firstname, lastname, delivery_optin, delivery_line1,
		delivery_line2, delivery_city, delivery_postcode }, user } = req;

	if ( email !== user.email ) {
		// TODO: update GoCardless email?
	}

	try {
		await user.update( { $set: {
			email, firstname, lastname, delivery_optin,
			delivery_address: delivery_optin ? {
				line1: delivery_line1,
				line2: delivery_line2,
				city: delivery_city,
				postcode: delivery_postcode
			} : {}
		} }, { runValidators: true } );

		req.log.info( {
			app: 'profile',
			action: 'update',
			sensitive: {
				profile: profile
			}
		} );

		req.flash( 'success', 'profile-updated' );
	} catch ( status ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Validation errors',
			validation: status.errors,
			sensitive: {
				body: req.body
			}
		} );

		var keys = Object.keys( status.errors );
		for ( var k in keys ) {
			var key = keys[k];
			req.flash( 'danger', status.errors[key].message );
		}
	}

	res.redirect( app.parent.mountpath + app.mountpath );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
