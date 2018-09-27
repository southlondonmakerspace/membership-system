const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';

const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Referrals } = require( __js + '/database' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const { gifts3, gifts5 } = require( __root + '/apps/join/gifts.json' );

const app = express();
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isLoggedIn );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', wrapAsync( async function( req, res ) {
	const referrals = await Referrals.find({ referrer: req.user }).populate('referree');
	res.render( 'index', { referrals } );
} ) );

app.get( '/:id', wrapAsync( async function( req, res ) {
	const referral = await Referrals.findOne({ referrer: req.user, _id: req.params.id }).populate('referree');
	res.render( 'referral', { referral, gifts3, gifts5 } );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
