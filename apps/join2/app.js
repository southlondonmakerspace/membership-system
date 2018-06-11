var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var passport = require( 'passport' );
var moment = require( 'moment' );

//var Mail = require( __js + '/mail' );

var JoinFlows = require( __js + '/database' ).JoinFlows;
var Members = require( __js + '/database' ).Members;
var Permissions = require( __js + '/database' ).Permissions;

var auth = require( __js + '/authentication' );
var { hasSchema } = require( __js + '/middleware' );

var config = require( __config + '/config.json' );

var GoCardless = require( __js + '/gocardless' )( config.gocardless );

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
	const name = GoCardless.getSubscriptionName(amountNo * (period === 'annually' ? 12 : 1), period);
	const completeUrl = config.audience + app.mountpath + '/complete';

	try {
		const [ redirectUrl, body ] =
			await GoCardless.createRedirectFlowPromise( name, sessionToken, completeUrl );

		await new JoinFlows({
			redirect_flow_id: body.redirect_flows.id,
			amount: amountNo,
			sessionToken, period
		}).save();

		res.redirect( redirectUrl );
	} catch ( error ) {
			req.flash( 'danger', 'gocardless-mandate-err' );
			res.redirect( app.mountpath );
	}
} );

app.get( '/complete', hasSchema(completeSchema).or400, async function( req, res ) {
	const { query: { redirect_flow_id } } = req;

	try {
		const { sessionToken, amount, period, actualAmount } =
			await JoinFlows.findOne({ redirect_flow_id });

		const permission = await Permissions.findOne( { slug: config.permission.member });

		const [ mandate_id, { redirect_flows } ] =
			await GoCardless.completeRedirectFlowPromise( redirect_flow_id, sessionToken );

		await JoinFlows.deleteOne({ redirect_flow_id });

		const customer = await GoCardless.getCustomerPromise( redirect_flows.links.customer );

		const member = new Members( {
			firstname: customer.given_name,
			lastname: customer.family_name,
			email: customer.email,
			delivery_optin: false,
			delivery_address: {
				line1: customer.address_line1,
				line2: customer.address_line2,
				city: customer.city,
				postcode: customer.postal_code
			},
			gocardless: {
				mandate_id
			},
			activated: true,
		} );

		try {
			await member.save();
		} catch ( saveError ) {
			// Duplicate key (on email)
			if ( saveError.code === 11000 ) {
				// TODO: handle case of duplicate email address
				throw saveError
			} else {
				throw saveError
			}
		}

		const [ subscription_id ] =
			await GoCardless.createSubscriptionPromise( mandate_id, actualAmount, period );

		await member.update({$set: {
			'gocardless.subscription_id': subscription_id,
			'gocardless.amount': amount,
			'gocardless.period': period
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
	} catch ( error ) {
		req.log.error({
			app: 'join',
			action: 'complete',
			error
		});

		throw error;
	}
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
