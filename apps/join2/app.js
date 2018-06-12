var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var moment = require( 'moment' );

const { JoinFlows, Members, Permissions } = require( __js + '/database' );

const auth = require( __js + '/authentication' );
const { hasSchema } = require( __js + '/middleware' );

const config = require( __config + '/config.json' );

const gocardless = require( __js + '/gocardless' );

const { getSubscriptionName } = require( __js + '/utils' );
const { customerToMember, joinFlowToSubscription } = require( './utils' );

const { joinSchema, completeSchema } = require( './schemas.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isNotLoggedIn );
app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'index' );
} );

app.post( '/', hasSchema(joinSchema).orFlash, async function( req, res ) {
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
} );

app.get( '/complete', hasSchema(completeSchema).orRedirect( '/join' ), async function( req, res ) {
	const { query: { redirect_flow_id } } = req;

	const permission = await Permissions.findOne( { slug: config.permission.member });

	// Load join data and complete redirect flow
	const joinFlow = await JoinFlows.findOne({ redirect_flow_id });
	const redirectFlow = await gocardless.redirectFlows.complete(redirect_flow_id, {
		session_token: joinFlow.sessionToken
	});
	await JoinFlows.deleteOne({ redirect_flow_id });

	const customer = await gocardless.customers.get(redirectFlow.links.customer);
	const mandateId = redirectFlow.links.mandate_id;

	const member = new Members( customerToMember( customer, mandateId ) );

	try {
		await member.save();
	} catch ( saveError ) {
		// Duplicate key (on email)
		if ( saveError.code === 11000 ) {
			// TODO: handle case of duplicate email address
			res.send({'blah': 'duplicate email'});
			return;
		} else {
			throw saveError;
		}
	}

	const subscription =
		await gocardless.subscriptions.create(joinFlowToSubscription(joinFlow, mandateId));

	await member.update({$set: {
		'gocardless.subscription_id': subscription.id,
		'gocardless.amount': joinFlow.amount,
		'gocardless.period': joinFlow.period
	}, $push: {
		permissions: {
			permission: permission.id,
			date_added: new Date(),
			date_expires: moment.utc().add(config.gracePeriod).toDate()
		}
	}});

	req.login(member, function ( loginError ) {
		if ( loginError ) {
			throw loginError;
		}
		res.redirect('/profile/complete');
	});
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
