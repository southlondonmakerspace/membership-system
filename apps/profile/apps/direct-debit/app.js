const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';

const express = require('express');

const auth = require( __js + '/authentication' );
const { Members } = require( __js + '/database' );
const gocardless = require( __js + '/gocardless' );
const mandrill = require( __js + '/mandrill' );
const{ hasSchema } = require( __js + '/middleware' );
const { getSubscriptionName, wrapAsync } = require( __js + '/utils' );

const { cancelSubscriptionSchema, updateSubscriptionSchema } = require('./schemas.json');

const app = express();
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
			amount: gc.actualAmount,
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
		await user.update( { $set: {
			'cancellation': { satisfied, reason, other }
		} } );

		await gocardless.subscriptions.cancel( user.gocardless.subscription_id );

		await user.update( { $unset: {
			'gocardless.subscription_id': true,
		}, $set: {
			'gocardless.cancelled_at': new Date()
		} } );

		await mandrill.sendToMember('cancelled-contribution-no-survey', user);

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
			await gocardless.subscriptions.update( user.gocardless.subscription_id, {
				amount: amount * 100,
				name: getSubscriptionName( amount, user.gocardless.period )
			} );

			await user.update( { $set: {
				'gocardless.amount': amount
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
