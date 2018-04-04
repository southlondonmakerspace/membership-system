var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Members = db.Members;

var config = require( __config + '/config.json' );

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
	res.locals.breadcrumb.push( {
		name: "Update"
	} );
	res.render( 'index', { user: req.user } );
} );

app.post( '/', auth.isLoggedIn, function( req, res ) {
	if ( ! req.body.firstname ||
		 ! req.body.lastname ) {
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

	if ( ! req.body.address ) {
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

	if ( req.body.address.split( '\n' ).length <= 2 ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Address did not have enough lines',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-address' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var postcode;
	var results = req.body.address.match( /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/ );

	if ( results ) {
		postcode = results[0];
	}

	if ( ! postcode ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Postcode was invalid or absent',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-postcode' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	postcodes.lookup( postcode ).then( function( data ) {
		var profile = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			address: req.body.address
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
