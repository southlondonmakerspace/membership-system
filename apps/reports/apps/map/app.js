var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
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

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	res.render( 'index' );
} );

app.get( '/data.json', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: config.permission.member }, function( err, membership_permission ) {
		Members.find( {
			permissions: {
				$elemMatch: {
					permission: membership_permission._id,
					date_added: { $lte: new Date() },
					$or: [
						{ date_expires: null },
						{ date_expires: { $gt: new Date() } }
					]
				}
			}
		}, function( err, members ) {
			var locations = [];
			for ( var m in members ) {
				var member = members[m];
				if ( member.postcode_coordinates.lat )
					locations.push( member.postcode_coordinates );
			}
			locations.sort();
			res.send( JSON.stringify( locations ) );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
