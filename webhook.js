const __config = __dirname + '/config/config.json';
const __src = __dirname + '/src';
const __js = __src + '/js';

const config = require( __config );

const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');

const log = require( __js + '/logging' ).log;
const { Members, Payments } = require( __js + '/database' ).connect( config.mongo );
const gocardless = require( __js + '/gocardless' );
const mandrill = require( __js + '/mandrill' );

const utils = require('./webhook-utils');

const app = express();
const textBodyParser = bodyParser.text( { type: 'application/json' } );

// Add logging capabilities
require( __js + '/logging' ).installMiddleware( app );

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
log.info( {
	app: 'webhook',
	action: 'start'
} );

const listener = app.listen( config.gocardless.port, config.host, function () {
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
	case 'refunds':
		return await handleRefundResourceEvent( event );
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
		amount_refunded: gcPayment.amount_refunded,
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
		const expiryDate = moment.utc(payment.charge_date)
			.add(utils.getSubscriptionDuration(subscription))
			.add(config.gracePeriod);

		const member = await Members.findOne( { _id: payment.member } );
		if (member.memberPermission) {
			const pendingUpdate = member.gocardless.pending_update;
			if (pendingUpdate && payment.charge_date >= pendingUpdate.date) {
				delete member.gocardless.pending_update;
			}

			member.memberPermission.date_expires = expiryDate.toDate();
			await member.save();

			log.info( {
				app: 'webhook',
				action: 'extend-membership',
				until: member.memberPermission.date_expires,
				sensitive: {
					member: member._id
				}
			} );
		} else {
			log.error( {
				app: 'webhook',
				action: 'extend-membership',
				date: expiryDate,
				error: 'Membership not found',
				sensitive: {
					member: member._id
				}
			} );
		}
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

		await mandrill.send('cancelled-contribution', member);

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

async function handleRefundResourceEvent( event ) {
	const gcPayment = await gocardless.payments.get( event.links.payment );
	const payment = await Payments.findOne( { payment_id: gcPayment.id } );

	if ( payment ) {
		await updatePayment( gcPayment, payment );
	}
}
