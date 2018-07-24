const __root = '../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Members } = require( __js + '/database' );
const mandrill = require( __js + '/mandrill' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const config = require( __config + '/config.json' );

const { customerToMember, createJoinFlow, completeJoinFlow, createSubscription } = require( './utils' );

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

	const completeUrl = config.audience + app.mountpath + '/complete';
	const redirectUrl = await createJoinFlow(amountNo, period, completeUrl);

	res.redirect( redirectUrl );
}));

app.get( '/complete', [
	auth.isNotLoggedIn,
	hasSchema(completeSchema).orRedirect( '/join' )
], wrapAsync(async function( req, res ) {
	const { customerId, mandateId, amount, period } =
		await completeJoinFlow(req.query.redirect_flow_id);

	const memberObj = await customerToMember(customerId, mandateId);

	try {
		const newMember = await Members.create(memberObj);
		await createSubscription(newMember, {amount, period});
		req.login(newMember, function ( loginError ) {
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
				res.redirect( app.mountpath + '/duplicate-email' );
			} else {
				oldMember.restart = {
					code: auth.generateCode(),
					customer_id: customerId,
					mandate_id: mandateId,
					amount, period
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
