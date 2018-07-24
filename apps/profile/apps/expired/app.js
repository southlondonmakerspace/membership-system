const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const express = require( 'express' );
const moment = require( 'moment' );

const auth = require( __js + '/authentication' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const config = require( __config + '/config.json' );

const { createJoinFlow, completeJoinFlow, createSubscription } = require( __root + '/apps/join2/utils' );

const { rejoinSchema, completeSchema } = require( './schemas.json' );

const app = express();
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isLoggedIn );

app.use( function( req, res, next ) {
	if (req.user.memberPermission && req.user.memberPermission.date_expires >= moment()) {
		res.redirect( '/profile' );
	} else {
		res.locals.app = app_config;
		res.locals.breadcrumb.push( {
			name: app_config.title,
			url: app.parent.mountpath + app.mountpath
		} );
		res.locals.activeApp = app_config.uid;
		next();
	}
} );

app.get( '/', function( req, res ) {
	res.render( 'expired', { user: req.user } );
} );

app.post( '/', hasSchema( rejoinSchema ).orFlash, wrapAsync( async (req, res) => {
	const { body: { period, amount, amountOther }, user } = req;

	const amountNo = amount === 'other' ? parseInt(amountOther) : parseInt(amount);
	
	if (user.gocardless.subscription_id) {
		// TODO: flash active subscription notice
		res.redirect( app.mountpath );
	// Has an active mandate, we can instantly restart!
	} else if (user.gocardless.mandate_id) {
		await createSubscription(user, {amount, period});
		// TODO: flash restarted!
		res.redirect('/profile');
	} else {
		const completeUrl = config.audience + app.mountpath + '/complete';
		const redirectUrl = await createJoinFlow(amountNo, period, completeUrl);
		res.redirect( redirectUrl );
	}
}));

app.get( '/complete', [
	hasSchema( completeSchema ).orRedirect('/profile')
], wrapAsync( async (req, res) => {
	const { user } = req;

	if (user.gocardless.subscription_id) {
		req.flash( 'danger', '' ); // TODO: flash already has sub
	} else {
		const { customerId, mandateId, amount, period } =
			await completeJoinFlow(req.query.redirect_flow_id);

		user.gocardless = {
			customer_id: customerId,
			mandate_id: mandateId
		};
		user.permissions = user.permissions.filter(p => !p.permission.equals(config.permission.memberId));

		await user.save();

		await createSubscription(user, {amount, period});
	}

	// TODO: flash restarted!
	res.redirect('/profile');
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
