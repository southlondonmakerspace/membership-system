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

app.get( '/', auth.isMember, function( req, res ) {
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
		if ( req.query.firstname ) {
			search['$and'].push( { firstname: new RegExp( '.*' + escapeStringRegexp( req.query.firstname ) + '.*', 'i' ) } );
			path['firstname'] = 'firstname=' + req.query.firstname;
		}
		if ( req.query.lastname ) {
			search['$and'].push( { lastname: new RegExp( '.*' + escapeStringRegexp( req.query.lastname ) + '.*', 'i' ) } );
			path['lastname'] = 'lastname=' + req.query.lastname;
		}
		if ( req.query.email && auth.canSuperAdmin( req ) == true ) {
			search['$and'].push( { email: new RegExp( '.*' + escapeStringRegexp( req.query.email ) + '.*', 'i' ) } );
			path['email'] = 'email=' + req.query.email;
		}
		if ( req.query.discourse ) {
			search['$and'].push( { 'discourse.username': new RegExp( '.*' + escapeStringRegexp( req.query.discourse ) + '.*', 'i' ) } );
			path['discourse'] = 'discourse=' + req.query.discourse;
		}
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
			inactive_members_path = append_path.join( '&' );

			// Search data
			var search_data = {
				firstname: req.query.firstname,
				lastname: req.query.lastname,
				email: req.query.email,
				discourse: req.query.discourse,
				show_inactive_members: req.query.show_inactive_members,
				permission: req.query.permission
			}

			Members.find( search ).limit( limit ).skip( limit * ( page - 1 ) ).sort( [ [ 'lastname', 1 ], [ 'firstname', 1 ] ] ).exec( function( err, members ) {
				// add more detail to Members
				members.forEach(function (member) {
						Payments.find({member:member._id}).sort({charge_date: 'descending'}).limit(1).exec( function (err, payments) {
							console.log(payments)
							member.payments = payments
						})
				})
				console.log(members)
				res.render( 'index', {
					members: members,
					permissions: permissions,
					pagination: pagination,
					limits: limits,
					count: members ? members.length : 0,
					total: total,
					search: search_data
				} );
			} );
		} );
	} );
} );


module.exports = function( config ) {
	app_config = config;
	return app;
};
