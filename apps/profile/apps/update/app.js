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

app.post( '/', auth.isLoggedIn, function( req, res ) {
	if ( ! req.body.firstname || ! req.body.lastname ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'First or last name were not provided',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'information-ommited' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( req.body.delivery_optin == 'yes' &&
		( ! req.body.delivery_line1 || ! req.body.delivery_city || ! req.body.delivery_postcode ) ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Address was not provided',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-address' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	postcodes.lookup( req.body.delivery_postcode ).then( function( data ) {
		var profile = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			delivery_optin: req.body.delivery_optin == 'yes',
			delivery_address: {
				line1: req.body.delivery_line1,
				line2: req.body.delivery_line2,
				city: req.body.delivery_city,
				postcode: req.body.delivery_postcode
			}
		};

		if ( data ) {
			profile.postcode_coordinates = {
				lat: data.latitude,
				lng: data.longitude,
			};
		} else {
			profile.postcode_coordinates = null;
		}

		Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
			if ( status ) {
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
			} else {
				req.log.info( {
					app: 'profile',
					action: 'update',
					sensitive: {
						profile: profile
					}
				} );

				req.flash( 'success', 'profile-updated' );
			}
			res.redirect( app.parent.mountpath + app.mountpath );
		} );
	}, function( error ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: error
		} );

		req.flash( 'danger', 'user-postcode' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
