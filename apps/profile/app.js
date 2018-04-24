var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';
var __apps = __dirname + '/apps';

var	express = require( 'express' ),
	app = express();

var moment = require( 'moment' );

var db = require( __js + '/database' ),
	Members = db.Members,
	Events = db.Events,
	Permissions = db.Permissions;

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' );

var apps = [];
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	if ( auth.activeMember( req ) ) {
		if ( auth.checkPermission( req, config.permission.access ) ) {
			Permissions.findOne( { slug: config.permission.access }, function ( err, access ) {
				Events.aggregate( [
					{
						$match: {
							happened: { $gte: moment().startOf('month').toDate(), $lt: moment().endOf('month').toDate() },
							permission: access._id,
							member: req.user._id,
							successful: { $ne: false }
						}
					},
					{
						$group: {
							_id: {
								member: "$member",
								day: { $dayOfMonth: "$happened" }
							}
						}
					},
					{
						$group: {
							_id: "$_id.member",
							days: { $push: "$_id.day" }
						}
					},
					{
						$project: {
							_id: 0,
							count: { $size: "$days" }
						}
					},
					{
						$sort: { count: -1 }
					}
				], function ( err, result ) {
					var member = {};
					var permissions = req.user.permissions.filter( function( p ) {
						if ( p.permission && p.permission.slug ) {
							if ( p.permission.slug == config.permission.member ) {
								return true;
							}
						}
						return false;
					} );
					if ( permissions.length > 0 ) member = permissions[0];
					res.render( 'profile', {
						user: req.user,
						count: result,
						membership_expires: ( member.date_expires !== undefined ? member.date_expires : null ),
						membership_amount: ( req.user.gocardless.amount !== undefined ? req.user.gocardless.amount: null )
					} );
				} );
			} );
		} else {
			var member = {};
			var permissions = req.user.permissions.filter( function( p ) {
				if ( p.permission && p.permission.slug ) {
					if ( p.permission.slug == config.permission.member ) {
						return true;
					}
				}
				return false;
			} );
			if ( permissions.length > 0 ) member = permissions[0];
			res.render( 'profile', {
				user: req.user,
				membership_expires: ( member.date_expires !== undefined ? member.date_expires : null )
			} );
		}
	} else {
		res.render( 'profile', { user: req.user } );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
