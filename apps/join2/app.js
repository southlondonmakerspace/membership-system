const __root = '../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const express = require( 'express' );
const moment = require( 'moment' );

const auth = require( __js + '/authentication' );
const { JoinFlows, Members } = require( __js + '/database' );
const gocardless = require( __js + '/gocardless' );
const { hasSchema } = require( __js + '/middleware' );
const { getSubscriptionName, wrapAsync } = require( __js + '/utils' );

const config = require( __config + '/config.json' );

const { customerToMember, joinFlowToSubscription } = require( './utils' );

const { joinSchema, completeSchema } = require( './schemas.json' );

const app = express();

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'index', { user: req.user } );
} );

app.post( '/', [
	auth.isNotLoggedIn,
	hasSchema(joinSchema).orFlash
], wrapAsync(async function( req, res ) {
	const { body: { period, amount, amountOther } } = req;

	const amountNo = amount === 'other' ? parseInt(amountOther) : parseInt(amount);

	const sessionToken = auth.generateCode();
	const name = getSubscriptionName(amountNo * (period === 'annually' ? 12 : 1), period);
	const completeUrl = config.audience + app.mountpath + '/complete';

	try {
		const redirectFlow = await gocardless.redirectFlows.create({
			description: name,
			session_token: sessionToken,
			success_redirect_url: completeUrl
		});

		await new JoinFlows({
			redirect_flow_id: redirectFlow.id,
			amount: amountNo,
			sessionToken, period
		}).save();

		res.redirect( redirectFlow.redirect_url );
	} catch ( error ) {
		req.flash( 'danger', 'gocardless-mandate-err' );
		res.redirect( app.mountpath );
	}
}));

app.get( '/complete', [
	auth.isNotLoggedIn,
	hasSchema(completeSchema).orRedirect( '/join' )
], wrapAsync(async function( req, res ) {
	const { query: { redirect_flow_id } } = req;

	// Load join data and complete redirect flow
	const joinFlow = await JoinFlows.findOne({ redirect_flow_id });
	const redirectFlow = await gocardless.redirectFlows.complete(redirect_flow_id, {
		session_token: joinFlow.sessionToken
	});

	const customerId = redirectFlow.links.customer;
	const mandateId = redirectFlow.links.mandate;

	const customer = await gocardless.customers.get(customerId);

	const member = new Members( customerToMember( customer, mandateId ) );

	try {
		await member.save();
	} catch ( saveError ) {
		// Duplicate key (on email)
		if ( saveError.code === 11000 ) {
			req.log.error({
				joinFlow,
				customerId,
				mandateId
			}, 'Duplicate email on sign up');

			res.redirect( app.mountpath + '/duplicate-email' );
			return;
		} else {
			throw saveError;
		}
	}

	await JoinFlows.deleteOne({redirect_flow_id});

	const subscription =
		await gocardless.subscriptions.create(joinFlowToSubscription(joinFlow, mandateId));

	await member.update({$set: {
		'gocardless.subscription_id': subscription.id,
		'gocardless.amount': joinFlow.amount,
		'gocardless.period': joinFlow.period
	}, $push: {
		permissions: {
			permission: config.permission.memberId,
			date_added: new Date(),
			date_expires: moment.utc(subscription.start_date).add(config.gracePeriod).toDate()
		}
	}});

	req.login(member, function ( loginError ) {
		if ( loginError ) {
			throw loginError;
		}
		res.redirect('/profile/complete');
	});
}));

app.get('/duplicate-email', function (req, res) {
	res.render('duplicate-email');
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
