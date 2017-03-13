var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Events = db.Events,
	Members = db.Members;

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	Permissions.findOne( { slug: 'door' }, function( err, permission ) {
		var start = new Date(); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.query.month !== undefined && req.query.year !== undefined ) {
			start.setMonth( req.query.month - 1 );
			start.setYear( req.query.year );
		}
		var end = new Date( start );
		end.setMonth( start.getMonth() + 1 );
		Events.aggregate( [
			{
				$match: {
					happened: { $gte: start, $lt: end },
					permission: permission._id,
					member: { $ne: null },
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
					member: "$_id",
					count: { $size: "$days" }
				}
			},
			{
				$sort: { count: -1 }
			}
		], function ( err, result ) {
			Members.populate( result, { path: 'member' }, function( err, members ) {
				var previous = new Date( start );
				previous.setMonth( start.getMonth() - 1 );
				res.render( 'index', {
					members: members,
					previous: previous,
					next: end,
					searchDate: start
				} );
			} );
		} );
	} );
} );

app.get( '/year/:year', auth.isMember, function( req, res ) {
	Permissions.findOne( { slug: 'door' }, function( err, permission ) {
		var start = new Date(); start.setMonth( 0 ); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.year !== undefined ) {
			start.setYear( req.params.year );
		}
		var end = new Date( start );
		end.setFullYear( start.getFullYear() + 1 );
		Events.aggregate( [
			{
				$match: {
					happened: { $gte: start, $lt: end },
					permission: permission._id,
					member: { $ne: null },
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
					member: "$_id",
					count: { $size: "$days" }
				}
			},
			{
				$sort: { count: -1 }
			}
		], function ( err, result ) {
			Members.populate( result, { path: 'member' }, function( err, members ) {
				var previous = new Date( start );
				previous.setFullYear( start.getFullYear() - 1 );
				res.render( 'year', {
					members: members,
					previous: previous,
					next: end,
					searchDate: start
				} );
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
