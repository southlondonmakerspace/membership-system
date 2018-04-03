var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

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
		name: "Emergency contact"
	} );
	res.render( 'index', { user: req.user } );
} );

app.post( '/', auth.isLoggedIn, function( req, res ) {
	var profile = {
		emergency_contact: {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			telephone: req.body.telephone
		}
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status ) {
			req.log.debug( {
				app: 'profile',
				action: 'emergency-contact',
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
				action: 'emergency-contact',
				sensitive: {
					profile: profile
				}
			} );

			req.flash( 'success', 'emergency-contact-updated' );
		}
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
