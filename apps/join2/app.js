const __root = '../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const express = require( 'express' );
const moment = require( 'moment' );

const auth = require( __js + '/authentication' );
const { JoinFlows, Members } = require( __js + '/database' );
const gocardless = require( __js + '/gocardless' );
const mandrill = require( __js + '/mandrill' );
const { hasSchema } = require( __js + '/middleware' );
const { getSubscriptionName, wrapAsync } = require( __js + '/utils' );

const config = require( __config + '/config.json' );

const { customerToMember, joinInfoToSubscription } = require( './utils' );

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

async function createSubscription(member, {amount, period}) {
	const subscription =
		await gocardless.subscriptions.create(joinInfoToSubscription(amount, period, member.gocardless.mandate_id));

	await member.update({$set: {
		'gocardless.subscription_id': subscription.id,
		'gocardless.amount': amount,
		'gocardless.period': period
	}, $push: {
		permissions: {
			permission: config.permission.memberId,
			date_expires: moment.utc(subscription.start_date).add(config.gracePeriod).toDate()
		}
	}});
}

app.get( '/complete', [
	auth.isNotLoggedIn,
	hasSchema(completeSchema).orRedirect( '/join' )
], wrapAsync(async function( req, res ) {
	const { query: { redirect_flow_id } } = req;

	const joinFlow = await JoinFlows.findOneAndRemove({ redirect_flow_id });

	const redirectFlow = await gocardless.redirectFlows.complete(redirect_flow_id, {
		session_token: joinFlow.sessionToken
	});
	const customerId = redirectFlow.links.customer;
	const mandateId = redirectFlow.links.mandate;

	const customer = await gocardless.customers.get(customerId);

	const memberObj = customerToMember(customer, mandateId);
	try {
		const member = await Members.create(memberObj);
		await createSubscription(member, joinFlow);
		req.login(member, function ( loginError ) {
			if ( loginError ) {
				throw loginError;
			}
			res.redirect('/profile/complete');
		});
	} catch ( saveError ) {
		// Duplicate email
		if ( saveError.code === 11000 ) {
			const oldMember = await Members.findOne({email: memberObj.email});
			if (oldMember.gocardless.subscription_id) {
				req.log.error({
					email: oldMember.email
				}, `Duplicate email ${oldMember.email} on sign up`);
				res.redirect( app.mountpath + '/duplicate-email' );
			} else {
				oldMember.restart = {
					code: 'asds', // TODO: generate code
					customer_id: customerId,
					mandate_id: mandateId,
					amount: joinFlow.amount,
					period: joinFlow.period
				};
				await oldMember.save();
				await mandrill.send('restart-membership', oldMember);

				res.redirect( app.mountpath + '/expired-member' );
			}
		} else {
			throw saveError;
		}
	}



}));

app.get('/restart/:code', wrapAsync(async (req, res) => {
	const member = await Members.findOne({'restart.code': req.params.code});

	const { customer_id, mandate_id, amount, period } = member.restart;

	member.gocardless = {customer_id, mandate_id};
	member.permissions = member.permissions.filter(p => !p.permission.equals(config.permission.memberId));
	member.restart = undefined;

	await member.save();

	await createSubscription(member, {amount, period});

	req.login(member, function ( loginError ) {
		if ( loginError ) {
			throw loginError;
		}
		res.redirect('/profile');
	});
}));

app.get('/expired-member', (req, res) => {
	res.render('expired-member');
});

app.get('/duplicate-email', (req, res) => {
	res.render('duplicate-email');
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
