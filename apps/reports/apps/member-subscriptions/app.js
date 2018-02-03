var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express()

var Options = require( __js + '/options.js' )();

var escapeStringRegexp = require( 'escape-string-regexp' );

var crypto = require( 'crypto' );

var moment = require( 'moment' );
var	db = require( __js + '/database' ),
	Members = db.Members,
	Payments = db.Payments


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

		// Process pagination
		var limit = 10;
		if ( req.query.limit && req.query.limit > 0 && req.query.limit <= 1000 )
			limit = parseInt( req.query.limit );

		var page = 1;
		if ( req.query.page && req.query.page > 0 )
			page = parseInt( req.query.page );

		var path = {}

		// Perform search
		Members.count({} , function( err, total ) {
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
				},
				{
					"$sort": {
						"lastname": 1
					}
				}
			])
			.exec( function( err, members ) {
				for (var i=0;i<members.length;i++)
				{
					members[i].gravatar = '//www.gravatar.com/avatar/' + crypto.createHash( 'md5' ).update( members[i].email ).digest( 'hex' )
				}
				// add more detail to Members

				res.render( 'index', {
					members: members,
					pagination: pagination,
					limits: limits,
					count: members ? members.length : 0,
					total: total
				} );
			} );
		} );

} );


module.exports = function( config ) {
	app_config = config;
	return app;
};
