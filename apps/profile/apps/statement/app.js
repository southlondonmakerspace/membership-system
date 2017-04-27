var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Members = db.Members,
	Payments = db.Payments,
	HistoricEvents = db.HistoricEvents;

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

app.get( '/', auth.isMember, function( req, res ) {
	Payments.find( { member: req.user._id }, function( err, payments ) {
		HistoricEvents.find( { user_id: req.user._id }, function( err, historic ) {
			for ( var h = 0; h < historic.length; h++ ) {
				historic[h].renumeration = Math.abs( historic[h].renumeration / 0.99 );
				historic[h].status = 'payment_paid_out';
			}
			res.render( 'index', { payments: payments.reverse(), historic: historic.reverse() } );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
