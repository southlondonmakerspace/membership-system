var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var logger = require(__js + '/logging');

var config = require( __config + '/config.json' );
var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' )
var exportCsv = require('./export-csv');
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'export';
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	res.render( 'index', {
		app: app_config
	} );
} );

app.get('/memberscsv', auth.isSuperAdmin, function( req, res ) {
	exportCsv.members(function (err, data) {
		if (err) {
			logger.log.error(err);
			res.status(500).send(err);
		} else {
			res.type('text/csv').attachment('members.csv').status(200).send(data);
		}
	})
});

app.get('/permissionscsv', auth.isSuperAdmin, function( req, res ) {
	exportCsv.permissions(function (err, data) {
		if (err) {
			logger.log.error(err);
			res.status(500).send(err);
		} else {
			res.type('text/csv').attachment('permissions.csv').status(200).send(data);
		}
	})
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
