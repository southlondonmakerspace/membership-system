var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Members = db.Members,
	Events = db.Events,
	Payments = db.Payments;

var Mail = require( __js + '/mail' );

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
		name: "Data Export"
	} );
	res.render( 'index' );
} );

app.post( '/', auth.isLoggedIn, function( req, res ) {
	var records = {}
	Members.findOne( { _id: req.user._id }, { 'permissions._id':0 } ).populate( 'permissions.permission', '-_id' ).exec( function( err, user ) {
		if ( err ) {
			req.log.error( {
				app: 'profile',
				action: 'data-export',
				error: 'Error fetching member:' + err,
			} );
			req.flash( 'danger', 'data-export-err' );
			res.status( 500 ).render('index');
			return;
		}
		records.user = user;
		records.user.password = undefined;
		var member_id = user._id;
		records.user._id = undefined;
		if (records.user.tag) {
			records.user.tag = undefined;
		}
		Events.find( { member: member_id }, { '_id': 0 } ).populate( 'permission', '-_id' ).exec( function (err, events) {
			if ( err ) {
				req.log.error( {
					app: 'profile',
					action: 'data-export',
					error: 'Error fetching events:' + err,
				} );
				req.flash( 'danger', 'data-export-err' );
				res.status( 500 ).render('index');
				return;
			}
			records.events = events;
			Payments.find( { member: member_id}, { '_id': 0 } ).exec( function (err, payments) {
				if ( err ) {
					req.log.error( {
						app: 'profile',
						action: 'data-export',
						error: 'Error fetching payments:' + err,
					} );
					req.flash( 'danger', 'data-export-err' );
					res.status( 500 ).render('index');
				}
				records.payments = payments;
				req.log.debug( {
					app: 'profile',
					action: 'data-export',
					message: 'User exported their data',
				} );
				res.setHeader('Content-disposition', 'attachment; filename=member-export.json');
				res.json( records );
			});
		});
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
