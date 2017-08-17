var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var moment = require( 'moment' );

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Events = db.Events,
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
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	res.render( 'index' );
} );

app.get( '/:slug/members/:year/:month', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) return res.render( '../../../../../src/views/404' );

		var start = new Date(); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.month && req.params.year ) {
			start.setMonth( parseInt( req.params.month ) - 1 );
			start.setYear( parseInt( req.params.year ) );
		}
		var end = new Date( start );
		end.setMonth( start.getMonth() + 1 );

		var previous = new Date( start );
		previous.setMonth( start.getMonth() - 1 );

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.locals.breadcrumb.push( {
			name: "Members"
		} );
		res.locals.breadcrumb.push( {
			name: start.getFullYear()
		} );
		res.locals.breadcrumb.push( {
			name: moment( start ).format( 'MMMM' )
		} );

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
						day: { $dayOfYear: "$happened" }
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
			Members.populate( result, { path: config.permission.member }, function( err, members ) {
				var total = 0;
				for ( var m in members ) {
					total += members[m].count;
				}
				res.render( 'members-year-month', {
					members: members,
					previous: previous,
					next: end,
					start: start,
					slug: req.params.slug,
					total: total
				} );
			} );
		} );
	} );
} );

app.get( '/:slug/members/:year', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) return res.render( '../../../../../src/views/404' );

		var start = new Date(); start.setMonth( 0 ); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.year ) {
			start.setFullYear( parseInt( req.params.year ) );
		}
		var end = new Date( start );
		end.setFullYear( start.getFullYear() + 1 );
		var previous = new Date( start );
		previous.setFullYear( start.getFullYear() - 1 );

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.locals.breadcrumb.push( {
			name: "Members"
		} );
		res.locals.breadcrumb.push( {
			name: start.getFullYear()
		} );

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
						day: { $dayOfYear: "$happened" }
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
			Members.populate( result, { path: config.permission.member }, function( err, members ) {
				var total = 0;
				for ( var m in members ) {
					total += members[m].count;
				}
				res.render( 'members-year', {
					members: members,
					previous: previous,
					next: end,
					start: start,
					slug: req.params.slug,
					total: total
				} );
			} );
		} );
	} );
} );

app.get( '/:slug/days/:year?', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) return res.render( '../../../../../src/views/404' );

		var start = new Date(); start.setMonth( 0 ); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.year ) {
			start.setFullYear( parseInt( req.params.year ) );
		}
		var end = new Date( start );
		end.setFullYear( start.getFullYear() + 1 );
		var previous = new Date( start );
		previous.setFullYear( start.getFullYear() - 1 );

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.locals.breadcrumb.push( {
			name: "Days"
		} );
		res.locals.breadcrumb.push( {
			name: start.getFullYear()
		} );

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
						day: { $dayOfYear: "$happened" },
					}
				}
			},
			{
				$group: {
					_id: "$_id.day",
					members: { $push: "$_id.member" }
				}
			},
			{
				$project: {
					_id: 0,
					day: "$_id",
					count: { $size: "$members" }
				}
			},
			{
				$sort: { day: 1 }
			}
		], function ( err, result ) {
			var labels = [];
			var data = [];
			var total = 0;
			for ( var r in result ) {
				labels.push( moment( start ).dayOfYear( result[r].day ) );
				data.push( result[r].count );
				total += result[r].count;
			}
			res.render( 'days', {
				result: result,
				previous: previous,
				next: end,
				start: start,
				slug: req.params.slug,
				data: data,
				labels: labels,
				total: total
			} );
		} );
	} );
} );

app.get( '/:slug/days-of-week/:year?', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) return res.render( '../../../../../src/views/404' );

		var start = new Date(); start.setMonth( 0 ); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.year ) {
			start.setFullYear( parseInt( req.params.year ) );
		}
		var end = new Date( start );
		end.setFullYear( start.getFullYear() + 1 );
		var previous = new Date( start );
		previous.setFullYear( start.getFullYear() - 1 );

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.locals.breadcrumb.push( {
			name: "Days of Week"
		} );
		res.locals.breadcrumb.push( {
			name: start.getFullYear()
		} );

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
						day: { $dayOfWeek: "$happened" },
						week: { $week: "$happened" },
					}
				}
			},
			{
				$group: {
					_id: "$_id.day",
					members: { $push: "$_id.member" }
				}
			},
			{
				$project: {
					_id: 0,
					day: "$_id",
					count: { $size: "$members" }
				}
			},
			{
				$sort: { day: 1 }
			}
		], function ( err, result ) {
			var data = {};
			var total = 0;
			for ( var r in result ) {
				data[ moment( start ).day( result[r].day - 1 ).format( 'dddd' ) ] = result[r].count;
				total += result[r].count;
			}
			res.render( 'days-of-week-year', {
				result: result,
				previous: previous,
				next: end,
				start: start,
				slug: req.params.slug,
				data: data,
				total: total
			} );
		} );
	} );
} );

app.get( '/:slug/days-of-week/:year/:month', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.params.slug }, function( err, permission ) {
		if ( ! permission ) return res.render( '../../../../../src/views/404' );

		var start = new Date(); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
		if ( req.params.year ) {
			start.setFullYear( parseInt( req.params.year ) );
			start.setMonth( parseInt( req.params.month ) - 1 );
		}
		var end = new Date( start );
		end.setMonth( start.getMonth() + 1 );
		var previous = new Date( start );
		previous.setMonth( start.getMonth() - 1 );

		res.locals.breadcrumb.push( {
			name: permission.name
		} );
		res.locals.breadcrumb.push( {
			name: "Days of Week"
		} );
		res.locals.breadcrumb.push( {
			name: start.getFullYear()
		} );
		res.locals.breadcrumb.push( {
			name: moment( start ).format( 'MMMM' )
		} );

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
						day: { $dayOfWeek: "$happened" },
						week: { $week: "$happened" },
					}
				}
			},
			{
				$group: {
					_id: "$_id.day",
					members: { $push: "$_id.member" }
				}
			},
			{
				$project: {
					_id: 0,
					day: "$_id",
					count: { $size: "$members" }
				}
			},
			{
				$sort: { day: 1 }
			}
		], function ( err, result ) {
			var data = {};
			var total = 0;
			for ( var r in result ) {
				data[ moment( start ).day( result[r].day - 1 ).format( 'dddd' ) ] = result[r].count;
				total += result[r].count;
			}
			res.render( 'days-of-week-month', {
				result: result,
				previous: previous,
				next: end,
				start: start,
				slug: req.params.slug,
				data: data,
				total: total
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
