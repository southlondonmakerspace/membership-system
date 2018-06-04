var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var passport = require( 'passport' );
var moment = require( 'moment' );

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var Mail = require( __js + '/mail' );

var JoinFlows = require( __js + '/database' ).JoinFlows;
var Members = require( __js + '/database' ).Members;
var Permissions = require( __js + '/database' ).Permissions;

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var GoCardless = require( __js + '/gocardless' )( config.gocardless );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'already-logged-in' );
		res.redirect( '/profile' );
	} else {
		res.render( 'index' );
	}
} );

app.post( '/', function( req, res ) {
	if ( req.user ) {
		req.flash( 'warning', 'already-logged-in' );
		res.redirect( '/profile' );
	} else {
		const period = req.body.period;

		if ( period !== 'monthly' && period !== 'annually' ) {
			req.flash( 'danger', 'user-period' );
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Invalid period'
			} );
			return;
		}

		const amount = req.body.amount;
		const amountNo =
			(amount === 'other' ? parseInt(req.body.amount_other) : parseInt(amount)) *
			(period === 'annually' ? 12 : 1);

		if ( isNaN( amountNo ) || amountNo < 1 ) {
			req.flash( 'danger', 'user-amount' );
			res.redirect( app.mountpath );
			req.log.debug( {
				app: 'join',
				action: 'signup',
				error: 'Invalid contribution amount.'
			} );
			return;
		}

		auth.generateActivationCode( function( session_token ) {
			GoCardless.createRedirectFlow( `Membership: £${amountNo} ${period}`, session_token, config.audience + app.mountpath + '/complete', function( error, redirect_url, body ) {
				if ( error ) {
					req.flash( 'danger', 'gocardless-mandate-err' );
					res.redirect( app.mountpath );
				} else {
					new JoinFlows({
						redirect_flow_id: body.redirect_flows.id,
						session_token, amount: amountNo, period
					}).save( function ( error ) {
						console.log( error );
						res.redirect( redirect_url );
					} );
				}
			} );
		} );
	}
} );

app.get( '/complete', async function( req, res ) {
	const redirect_flow_id = req.query.redirect_flow_id;

	if ( redirect_flow_id ) {

		try {
			const { session_token, amount, period } = await JoinFlows.findOne({ redirect_flow_id });

			const permission = await Permissions.findOne( { slug: config.permission.member });

			const [ mandate_id, { redirect_flows } ] =
				await GoCardless.completeRedirectFlowPromise( redirect_flow_id, session_token );

			await JoinFlows.deleteOne({ redirect_flow_id });

			const customer = await GoCardless.getCustomerPromise( redirect_flows.links.customer );

			const member = new Members( {
				firstname: customer.given_name,
				lastname: customer.family_name,
				email: customer.email,
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

			await member.save();

			// TODO: handle case of duplicate email address

			const [ subscription_id ] =
				await GoCardless.createSubscriptionPromise( mandate_id, amount, period, `Membership: £${amount} ${period}`, {} );

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

			req.login(member, function (err) {
				if (err) {
					console.log(err);
					res.send(member);
				} else {
					res.redirect('/profile');
				}
			});
		} catch (err) {
			res.status(500).send(err);
		}
	}
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
