const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';

const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Referrals } = require( __js + '/database' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const { gifts3, gifts5 } = require( __root + '/apps/join/gifts.json' );
const { getJTJInStock, isGiftInStock, updateGiftStock } = require( __root + '/apps/join/utils' );

const { chooseGiftSchema } = require( './schema.json' );

const giftsById = {};
[...gifts3, ...gifts5].forEach(gift => giftsById[gift.id] = gift);

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

app.get( '/', wrapAsync( async ( req, res ) => {
	const referrals = await Referrals.find({ referrer: req.user }).populate('referree');
	res.render( 'index', { referrals, giftsById } );
} ) );

app.get( '/:id', wrapAsync( async ( req, res ) => {
	const referral = await Referrals.findOne({ _id: req.params.id, referrer: req.user }).populate('referree');
	const jtjInStock = await getJTJInStock();
	res.render( 'referral', { referral, gifts3, gifts5, jtjInStock } );
} ) );

app.post( '/:id', hasSchema(chooseGiftSchema).orFlash, wrapAsync( async ( req, res ) => {
	const { referralGift, referralGiftOptions } = req.body;

	if (await isGiftInStock({referralGift, referralGiftOptions})) {
		await Referrals.updateOne({
			_id: req.params.id,
			referrer: req.user,
			referrerGift: {$exists: false} // Don't update gifts
		}, {$set: {
			referrerGift: referralGift,
			referrerGiftOptions: referralGiftOptions
		}});

		await updateGiftStock({referralGift, referralGiftOptions});

		req.flash( 'success', 'referral-gift-chosen' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} else {
		req.flash( 'warning', 'referral-gift-no-stock' );
		res.redirect( req.originalUrl );
	}
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
