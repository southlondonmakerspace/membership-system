const moment = require('moment');

var __config = __dirname + '/config/config.json';
var __src = __dirname + '/src';
var __js = __src + '/js';

var log = require( __js + '/logging' ).log;
log.info( {
	app: 'webhook',
	action: 'start'
} );

var config = require( __config ),
	db = require( __dirname + '/src/js/database' ).connect( config.mongo ),
	express = require( 'express' ),
	app = express(),
	bodyParser = require( 'body-parser' ),
	textBodyParser = bodyParser.text( { type: 'application/json' } );

const gocardless = require( __js + '/gocardless' );

var utils = require('./webhook-utils');

// add logging capabilities
require( __js + '/logging' ).installMiddleware( app );

var Members = db.Members,
	Payments = db.Payments;

app.get( '/ping', function( req, res ) {
	req.log.info( {
		app: 'webhook',
		action: 'ping'
	} );
	res.sendStatus( 200 );
} );

app.post( '/', textBodyParser, async function( req, res ) {
	const valid = gocardless.webhooks.validate( req );

	if ( valid ) {
		var events = JSON.parse( req.body ).events;

		try {
			for ( var e in events ) {
				await handleResourceEvent( events[e] );
			}

			res.sendStatus( 200 );
		} catch ( error ) {
			console.log( error );
			req.log.error( {
				app: 'webhook',
				action: 'main',
				error
			} );
			res.status( 500 ).send( error );
		}
	} else {
		req.log.info( {
			app: 'webhook',
			action: 'main',
			error: 'invalid webhook signature'
		} );
		res.sendStatus( 498 );
	}
} );

// Start server
var listener = app.listen( config.gocardless.port, config.host, function () {
	log.debug( {
		app: 'webhook',
		action: 'start-webserver',
		message: 'Started',
		address: listener.address()
	} );
} );

async function handleResourceEvent( event ) {
	switch( event.resource_type ) {
	case 'payments':
		return await handlePaymentResourceEvent( event );
	case 'subscriptions':
		return await handleSubscriptionResourceEvent( event );
	case 'mandates':
		return await handleMandateResourceEvent( event );
	default:
		log.debug( {
			app: 'webhook',
			action: 'unhandled-resource-event',
			event: event
		} );
		break;
	}
}

async function handlePaymentResourceEvent( event ) {
	const gcPayment = await gocardless.payments.get( event.links.payment );
	const payment =
		await Payments.findOne( { payment_id: gcPayment.id } ) ||
		await createPayment( gcPayment );

	switch( event.action ) {
	case 'confirmed': // Collected
		await confirmPayment( gcPayment, payment );
	case 'created': // Pending
	case 'submitted': // Processing
	case 'cancelled': // Cancelled
	case 'failed': // Failed
	case 'paid_out': // Received
		await updatePayment( gcPayment, payment );
		break;
	}
}

async function createPayment( gcPayment ) {
	const member = await Members.findOne( { 'gocardless.mandate_id': gcPayment.links.mandate } );
	const payment = utils.createPayment( gcPayment );

	if ( member ) {
		log.info( {
			app: 'webhook',
			action: 'create-payment',
			payment: payment,
			member: member._id
		} );

		return await new Payments( { ...payment, member: member._id } ).save();
	} else {
		log.info( {
			app: 'webhook',
			action: 'create-unlinked-payment',
			payment: payment
		} );

		return await new Payments( payment ).save();
	}
}

async function updatePayment( gcPayment, payment ) {
	await payment.update( { $set: {
		status: gcPayment.status,
		updated: new Date()
	} } );

	log.info( {
		app: 'webhook',
		action: 'update-payment',
		payment: payment
	} );
}

async function confirmPayment( gcPayment, payment ) {
	if ( payment.member ) {
		const subscription = await gocardless.subscriptions.get(payment.subscription_id);
		const date = moment(payment.charge_date)
			.add(utils.getSubscriptionDuration(subscription))
			.add(config.gracePeriod);

		const member = await Members.findOne( { _id: payment.member } ).populate( 'permissions.permission' ).exec();

		for ( var p = 0; p < member.permissions.length; p++ ) {
			if ( member.permissions[p].permission.slug == config.permission.member ) {
				// Remove any pending updates
				// TODO: check this is the correct update
				delete member.gocardless.pending_update;

				member.permissions[p].date_expires = date.toDate();
				await member.save();

				log.info( {
					app: 'webhook',
					action: 'extend-membership',
					until: member.permissions[p].date_expires,
					sensitive: {
						member: member._id
					}
				} );

				return;
			}
		}

		// If permission not found
		log.error( {
			app: 'webhook',
			action: 'extend-membership',
			date: date,
			error: 'Membership not found',
			sensitive: {
				member: member._id
			}
		} );
	}
}

// Subscription events

async function handleSubscriptionResourceEvent( event ) {
	switch( event.action ) {
	case 'created':
	case 'customer_approval_granted':
	case 'payment_created':
	case 'amended':
		// Do nothing, we already have the details on file.
		break;
	case 'customer_approval_denied':
	case 'cancelled':
	case 'finished':
		// Remove the subscription from the database
		await cancelledSubscription( event );
		break;
	}
}

async function cancelledSubscription( event ) {
	const member = await Members.findOne( { 'gocardless.subscription_id': event.links.subscription } );

	if ( member ) {
		await member.update( { $unset: {
			'gocardless.subscription_id': true,
			'gocardless.cancelled_at': new Date()
		} } );

		log.info( {
			app: 'webhook',
			action: 'remove-subscription-id',
			sensitive: {
				member: member._id,
				subscription_id: event.links.subscription
			}
		} );
	} else {
		log.info( {
			app: 'webhook',
			action: 'unlink-subscription',
			sensitive: {
				subscription_id: event.links.subscription
			}
		} );
	}
}

async function handleMandateResourceEvent( event ) {
	switch( event.action ) {
	case 'created':
	case 'customer_approval_granted':
	case 'customer_approval_skipped':
	case 'submitted':
	case 'active':
	case 'transferred':
		// Do nothing, we already have the details on file.
		break;
	case 'reinstated':
		log.info( {
			app: 'webhook',
			action: 'reinstate-mandate',
			message: 'Mandate reinstated, its likely this mandate wont be linked to a member...',
			sensitive: {
				event: event
			}
		} );
		break;
	case 'cancelled':
	case 'failed':
	case 'expired':
		// Remove the mandate from the database
		await cancelledMandate( event );
		break;
	}
}

async function cancelledMandate( event ) {
	const member = await Members.findOne( { 'gocardless.mandate_id': event.links.mandate } );

	if ( member ) {
		await member.update( { $unset: {
			'gocardless.mandate_id': true
		} } );

		log.info( {
			app: 'webhook',
			action: 'remove-mandate-id',
			sensitive: {
				member: member._id,
				mandate_id: event.links.mandate
			}
		} );
	} else {
		log.info( {
			app: 'webhook',
			action: 'unlink-mandate',
			sensitive: {
				mandate_id: event.links.mandate
			}
		} );
	}
}
