var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var moment = require( 'moment' );

var db = require( __js + '/database' ),
	Payments = db.Payments,
	Members = db.Members;

var auth = require( __js + '/authentication' );

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

app.get( '/:year?/:month?', auth.isSuperAdmin, function( req, res ) {
	var start = new Date(); start.setDate( 1 ); start.setHours( 0 ); start.setMinutes( 0 ); start.setSeconds( 0 );
	if ( req.params.month && req.params.year ) {
		start.setMonth( parseInt( req.params.month ) - 1 );
		start.setYear( parseInt( req.params.year ) );
	}

	if ( moment( start ).isAfter( moment() ) ) {
		req.flash( 'warning', 'transaction-date-in-future' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var end = new Date( start );
	end.setMonth( start.getMonth() + 1 );

	var previous = new Date( start );
	previous.setMonth( start.getMonth() - 1 );

	res.locals.breadcrumb.push( {
		name: moment( start ).format( 'MMMM YYYY' )
	} );

	Payments.find( {
		created: {
			$gte: start,
			$lt: end
		}
	} ).populate( 'member' ).exec( function( err, payments ) {
		var total = 0;
		for ( var p in payments ) {
			if ( Number.isInteger( payments[p].amount ) )
				if ( payments[p].status == 'payment_paid_out' )
					total += payments[p].amount;
		}
		res.render( 'index', {
			payments: payments,
			total: total,
			next: end,
			previous: previous,
			start: start
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
