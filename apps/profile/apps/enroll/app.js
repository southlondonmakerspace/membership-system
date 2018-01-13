var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config/config.json';

var config = require( __config );

var	express = require( 'express' ),
	app = express();

var	db = require( __js + '/database' ),
	Members = db.Members,
	Enroll = db.Enroll,
	Permissions = db.Permissions;

var moment = require( 'moment' );

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

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.render( 'index' );
} );

app.get( '/:enrollment_code', auth.isLoggedIn, function( req, res ) {
	if ( req.params.enrollment_code.match( /^\w{20}$/ ) === null ) {
		res.redirect( app.parent.mountpath + app.mountpath );
	} else {
		res.render( 'index', { enrollment_code: req.params.enrollment_code } );
	}
} );

app.post( '/', auth.isLoggedIn, function( req, res ) {
	if ( req.user.tag.id && req.body.replace !== 'true' ) {
		res.render( 'replace', { code: req.body.enrollment_code } );
	} else {
		if ( ! req.body.enrollment_code ) {
				req.flash( 'danger', 'information-ommited' );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
		}

		Enroll.findOne( {
			code: req.body.enrollment_code
		}, function ( err, record ) {
			if ( ! record ) {
				req.flash( 'danger', 'enroll-invalid' );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			Members.findOne( { 'tag.id': record.tag }, function( err, member ) {
				if ( member ) {
					record.remove( function( error ) {} );
					req.flash( 'danger', 'enroll-tag-dupe' );
					res.redirect( '/profile/tag' );
					return;
				}

				var created = moment( record.created );
				var monthFromToday = moment().subtract( 1, 'months' );

				if ( created.isBefore( monthFromToday ) ) {
					record.remove( function( error ) {} );
					req.flash( 'danger', 'enroll-expired' );
					res.redirect( app.parent.mountpath + app.mountpath );
					return;
				}

				if ( req.body.replace && req.user.tag && req.user.tag.id ) {
					console.log( 'Revoking tag: ' + req.user.tag.id + ' for user: ' + req.user.email );
				}
				req.user.tag.id = record.tag;
				req.user.tag.hashed = auth.hashTag( record.tag );

				Permissions.findOne( { slug: config.permission.access }, function( err, permission ) {
					var foundPermission = false;
					for ( var p = 0; p < req.user.permissions.length; p++ ) {
						if ( req.user.permissions[p].permission.slug == config.permission.access ) {
							foundPermission = true;
						}
					}

					if ( ! foundPermission ) {
						req.user.permissions.push( {
							permission: permission.id,
							date_added: new Date()
						} );
					}

					req.user.save( function( error ) {
						console.log( 'Enrolling tag: ' + record.tag + ' for user: ' + req.user.email );

						if ( ! foundPermission ) {
							console.log( 'Granting "' + req.user.email + '" access permission' );
						}

						record.remove( function( error ) {} );
						req.flash( 'success', 'enroll-success' );
						res.redirect( '/profile/tag' );
					} );
				} );
			} );
		} );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
