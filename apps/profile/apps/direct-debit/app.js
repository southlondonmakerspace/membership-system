var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' ),
	Options = require( __js + '/options.js' )();

var auth = require( __js + '/authentication' ),
	{ hasSchema } = require( __js + '/middleware' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Members = db.Members;

const { cancelSubscriptionSchema, updateSubscriptionSchema } = require('./schemas.json');

var GoCardless = require( __js + '/gocardless' )( config.gocardless );

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
		res.render( 'complete', {
			amount: user.gocardless.actualAmount,
			period: user.gocardless.period,
			pending_update: user.gocardless.pending_update
		} );
	} else {
		res.render( 'cancelled' );
	}
} );

/*app.post( '/create-subscription', auth.isLoggedIn, function( req, res ) {
	if ( ! req.user.gocardless.subscription_id ) {
		if ( ! req.body.amount || ! req.body.day_of_month ) {
			req.flash( 'danger', 'information-ommited' );
			res.redirect( app.parent.mountpath );
			return;
		}
		var min = ( req.user.gocardless.minimum ? parseInt( req.user.gocardless.minimum ): Options.getInt( 'gocardless-minimum' ) );

		if ( parseInt( req.body.amount ) < min ) {
			req.flash( 'danger', Options.getText( 'flash-gocardless-subscription-min' ).replace( '%', min ) );
			return res.redirect( app.parent.mountpath + app.mountpath );
		}

		var day_of_month = parseInt( req.body.day_of_month );

		if ( day_of_month.isNaN || day_of_month > 28 || day_of_month < -1 ) {
			req.flash( 'danger', 'gocardless-subscription-invalid-day' );
			return res.redirect( app.parent.mountpath + app.mountpath );
		}

		GoCardless.createSubscription( req.user.gocardless.mandate_id, req.body.amount, req.body.day_of_month, 'Membership', {}, function( error, subscription_id ) {
			if ( error ) {
				req.flash( 'danger', 'gocardless-subscription-err' );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				Members.update( { _id: req.user._id }, { $set: {
					'gocardless.subscription_id': subscription_id,
					'gocardless.amount': req.body.amount
				}, $unset: {
					'signup_override': true
				} }, function ( ) {
					req.flash( 'success', 'gocardless-subscription-success' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} );
			}
		} );
	} else {
		req.flash( 'warning', 'gocardless-subscription-exists' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );*/

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
], async ( req, res ) => {
	const { user, body: { reason } } = req;

	try {
		await GoCardless.cancelSubscriptionPromise( user.gocardless.subscription_id );

		await Members.update( { _id: user._id }, { $unset: {
			'gocardless.subscription_id': true
		}, $set: {
			'cancellation_reason': reason
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
} );

app.get( '/update-subscription', isLoggedInWithSubscription, function( req, res ) {
	res.redirect( app.parent.mountpath + app.mountpath );
} );

app.post( '/update-subscription', [
	isLoggedInWithSubscription,
	hasSchema(updateSubscriptionSchema).orFlash
], async ( req, res ) => {
	const { body:  { amount }, user } = req;

	try {
		const { subscriptions } =
			await GoCardless.updateSubscriptionPromise( user.gocardless.subscription_id, amount, user.gocardless.period );

		const payment = subscriptions.upcoming_payments.find( p => p.amount === amount * 100 );

		await user.update( { $set: {
			'gocardless.pending_update': payment ? {
				amount,
				date: new Date( payment.charge_date )
			} : { amount }
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

	res.redirect( app.parent.mountpath + app.mountpath );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
