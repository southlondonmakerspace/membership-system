var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	discourse = require( __js + '/discourse' );

var Options = require( __js + '/options.js' )();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var escapeStringRegexp = require( 'escape-string-regexp' );

var moment = require( 'moment' );
var	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	Payments = db.Payments,
	Events = db.Events;

var Mail = require( __js + '/mail' );

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'members';
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		var filter_permissions = [];

		// If not admin or requesting active members only add member permission to filtering list
		if ( ! ( auth.canSuperAdmin( req ) == true && req.query.show_inactive_members ) ) {
			var member = permissions.filter( function( permission ) {
				if ( permission.slug == config.permission.member ) return true;
				return false;
			} )[0];
			filter_permissions.push( member );
			permissions = permissions.filter( function( p ) {
				if ( p.slug == config.permission.member ) return false;
				return true;
			} );
		}

		// If requested add custom permission to filtering list
		var permission;
		if ( req.query.permission ) {
			permission = permissions.filter( function( permission ) {
				if ( permission.slug == req.query.permission ) return true;
				return false;
			} );
			if ( permission.length !== 1 ) {
				permission = null;
			} else if ( permission.length === 1 ) {
				permission = permission[0];
				filter_permissions.push( permission );
				res.locals.breadcrumb.push( {
					name: permission.name,
				} );
			}
		}

		// Add permission list to search parameters
		var search = { $and: [] };
		if ( filter_permissions.length > 0 ) {
			var filter = [];
			for ( var fp in filter_permissions ) {
				filter.push( {
					permissions: {
						$elemMatch: {
							permission: filter_permissions[fp]._id,
							date_added: { $lte: new Date() },
							$or: [
								{ date_expires: null },
								{ date_expires: { $gt: new Date() } }
							]
						}
					}
				} );
			}
			if ( filter != [] ) search['$and'] = filter;
		}

		var path = {};
		if ( search['$and'].length == 0 ) search = {};

		// Process pagination
		var limit = 10;
		if ( req.query.limit && req.query.limit > 0 && req.query.limit <= 1000 )
			limit = parseInt( req.query.limit );

		var page = 1;
		if ( req.query.page && req.query.page > 0 )
			page = parseInt( req.query.page );

		// Perform search
		Members.count( search, function( err, total ) {
			if ( req.query.show_inactive_members ) path.show_inactive_members = 'show_inactive_members=true';
			if ( req.query.limit && req.query.limit > 0 && req.query.limit <= 1000 ) path.limit = 'limit=' + limit;
			if ( req.query.page && req.query.page > 0 ) path.page = 'page=' + page;

			// Pages
			var append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key != 'page' ) append_path.push( path[key] );
			} );
			append_path = append_path.join( '&' );
			form_path = append_path;

			var pages = [];
			for ( var p = 1; p <= Math.ceil( total / limit ); p++ ) {
				var item = {
					number: p,
					path: '?page=' + p + ( append_path ? '&' + append_path : '' )
				}
				pages.push( item );
			}
			var next = ( page + 1 ) <= pages.length ? pages[ page ] : null;
			var prev = ( page - 1 ) > 0 ? pages[ page - 2 ] : null;
			var pagination = {
				pages: pages,
				limit: limit,
				page: page,
				prev: prev,
				next: next,
				total: pages.length
			};

			// Limit
			append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key == 'limit' ) return;
				if ( key == 'page' ) return;
				append_path.push( path[key] );
			} );
			append_path = append_path.join( '&' );

			var limits = [ 10, 25, 50, 100, 250, 500, 1000 ];
			limits.forEach( function( limit, l ) {
				limits[l] = {
					number: limit,
					path: '?limit=' + limit + ( append_path ? '&' + append_path : '' )
				}
			} );

			// Inactive members
			append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key == 'show_inactive_members' ) return;
				if ( key == 'page' ) return;
				append_path.push( path[key] );
			} );

/*,
{
	"$group": {
		"_id": "$_id",
		"lastPayment": {
			"$last":"$payment"
		}
	}
}*/

			Members.aggregate([
				{
					"$skip": limit * ( page - 1 )
				},
				{
					"$limit": limit
				},
				{
					"$lookup": {
						"from": "payments",
						"localField": "member",
						"foreignField": "members._id",
						"as":"payments"
					}
				},
				{
					"$unwind":  "$payments"
				},
				{
					"$sort": {
						"payments.updated": 1
					}
				},
				{
					"$group": {
						"_id":  "$_id",
						"member": {
							"$last": "$$ROOT"
						}
					}
				},
				{
					"$replaceRoot": {
						"newRoot": "$member"
					}
				}
			])
			.exec( function( err, members ) {
				for (var i=0;i<members.length;i++)
				{
					members[i].gravatar = '//www.gravatar.com/avatar/' + crypto.createHash( 'md5' ).update( members[i].email ).digest( 'hex' )
				}
				// add more detail to Members
				console.log(members)
				res.render( 'index', {
					members: members,
					permissions: permissions,
					pagination: pagination,
					limits: limits,
					count: members ? members.length : 0,
					total: total
				} );
			} );
		} );
	} );
} );


module.exports = function( config ) {
	app_config = config;
	return app;
};
