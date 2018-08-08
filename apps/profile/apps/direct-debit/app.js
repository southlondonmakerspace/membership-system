var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	{ hasSchema } = require( __js + '/middleware' ),
	db = require( __js + '/database' ),
	Members = db.Members;

const { cancelSubscriptionSchema, updateSubscriptionSchema } = require('./schemas.json');

const { getSubscriptionName, wrapAsync } = require( __js + '/utils' );
const gocardless = require( __js + '/gocardless' );

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

app.get( '/', auth.isLoggedIn, function( req, res ) {
	const { user } = req;

	if ( user.gocardless.subscription_id ) {
		const gc = user.gocardless;
		res.render( 'active', {
			amount: gc.pending_update && gc.pending_update.amount || gc.actualAmount,
			period: gc.period
		} );
	} else {
		res.render( 'cancelled' );
	}
} );

function isLoggedInWithSubscription( req, res, next ) {
	auth.isLoggedIn(req, res, () => {
		if ( req.user.gocardless.subscription_id ) {
			next();
		} else {
			req.flash( 'danger', 'gocardless-subscription-doesnt-exist' );
			res.redirect( app.parent.mountpath + app.mountpath );
		}
	});
}

app.get( '/cancel-subscription', isLoggedInWithSubscription, ( req, res ) => {
	res.render( 'cancel-subscription' );
} );

app.post( '/cancel-subscription', [
	isLoggedInWithSubscription,
	hasSchema(cancelSubscriptionSchema).orFlash
], wrapAsync( async ( req, res ) => {
	const { user, body: { satisfied, reason, other } } = req;

	try {
		await gocardless.subscriptions.cancel( user.gocardless.subscription_id );

		await Members.update( { _id: user._id }, { $unset: {
			'gocardless.subscription_id': true
		}, $set: {
			'cancellation': {
				satisfied, reason, other
			}
		} } );

		req.flash( 'success', 'gocardless-subscription-cancelled' );
	} catch ( error ) {
		req.log.error( {
			app: 'direct-debit',
			action: 'cancel-subscription',
			error
		});

		req.flash( 'danger', 'gocardless-subscription-cancellation-err' );
	}

	res.redirect( app.parent.mountpath + app.mountpath );
} ) );

app.get( '/update-subscription', isLoggedInWithSubscription, function( req, res ) {
	res.redirect( app.parent.mountpath + app.mountpath );
} );

app.post( '/update-subscription', [
	isLoggedInWithSubscription,
	hasSchema(updateSubscriptionSchema).orFlash
], wrapAsync( async ( req, res ) => {
	const { body:  { amount }, user } = req;

	if ( user.gocardless.period !== 'monthly' ) {
		req.flash( 'danger', 'gocardless-subscription-updating-err' );
	} else {
		try {
			const subscription = await gocardless.subscriptions.update( user.gocardless.subscription_id, {
				amount: amount * 100,
				name: getSubscriptionName( amount, user.gocardless.period )
			} );

			const payment = subscription.upcoming_payments.find( p => p.amount === subscription.amount );

			await user.update( { $set: {
				'gocardless.pending_update': {
					amount,
					...payment && { date: new Date( payment.charge_date ) }
				}
			} } );

			req.flash( 'success', 'gocardless-subscription-updated' );
		} catch ( error ) {
			req.log.error( {
				app: 'direct-debit',
				action: 'update-subscription',
				error
			});

			req.flash( 'danger', 'gocardless-subscription-updating-err' );
		}
	}

	res.redirect( app.parent.mountpath + app.mountpath );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
