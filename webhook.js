var __config = __dirname + '/config/config.json';
var __static = __dirname + '/static';
var __src = __dirname + '/src';
var __js = __src + '/js';
var __views = __src + '/views';

var log = require( __js + '/logging' ).log;
log.info( {
	app: 'webhook',
	action: 'start'
} );

var config = require( __config ),
	db = require( __dirname + '/src/js/database' ).connect( config.mongo ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	bodyParser = require( 'body-parser' ),
	textBodyParser = bodyParser.text( { type: 'application/json' } ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

// add logging capabilities
require( __js + '/logging' ).installMiddleware( app );

var Options = require( __js + '/options' )();

var Members = db.Members,
	Permissions = db.Permissions,
	Payments = db.Payments;

var Mail = require( __js + '/mail' );

app.get( '/ping', function( req, res ) {
	req.log.info( {
		app: 'webhook',
		action: 'ping'
	} );
	res.sendStatus( 200 );
} );

app.post( '/', textBodyParser, function( req, res ) {
	if ( req.headers['webhook-signature'] && req.headers['content-type'] == 'application/json' ) {
		GoCardless.validateWebhook( req.headers['webhook-signature'], req.body, function( valid ) {
			if ( valid ) {
				var events = JSON.parse( req.body ).events;

				for ( var e in events ) {
					handleResourceEvent( events[e] );
				}

				res.sendStatus( 200 );
			} else {
				req.log.info( {
					app: 'webhook',
					action: 'main',
					error: 'invalid webhook signature'
				} );
				res.sendStatus( 498 );
			}
		} );
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
var listener = app.listen( config.gocardless.port ,config.host, function () {
	log.debug( {
		app: 'webhook',
		action: 'start-webserver',
		message: 'Started',
		address: listener.address()
	} );
} );

function handleResourceEvent( event ) {
	switch( event.resource_type ) {
		case 'payments':
			handlePaymentResourceEvent( event );
			break;
		case 'subscriptions':
			handleSubscriptionResourceEvent( event );
			break;
		case 'mandates':
			handleMandateResourceEvent( event );
			break;
		default:
			log.debug( {
				app: 'webhook',
				action: 'unhandled-resource-event',
				event: event
			} );
			break;
	}
}

function handlePaymentResourceEvent( event ) {
	switch( event.action ) {
		case 'created': // Pending
			createPayment( event );
			break;
		case 'confirmed': // Collected
			extendMembership( event );
		case 'submitted': // Processing
		case 'cancelled': // Cancelled
		case 'failed': // Failed
		case 'paid_out': // Received
			updatePayment( event );
			break;
	}
}

function createPayment( event ) {
	var payment = {
		payment_id: event.links.payment,
		created: new Date( event.created_at ),
		updated: new Date(),
		status: event.details.cause
	};

	// Fetch amount
	GoCardless.getPayment( event.links.payment, function( error, response ) {
		if ( ! error ) {
			payment.charge_date = new Date( response.charge_date );
			var amount = parseInt( response.amount );
			payment.amount = amount / 100;
		}
		if ( event.links.subscription ) {
			payment.subscription_id = event.links.subscription;
			payment.description = 'Membership';

			Members.findOne( { 'gocardless.subscription_id': payment.subscription_id }, function( err, member ) {
				if ( member ) {
					payment.member = member._id;
				}
				new Payments( payment ).save( function( err ) {
					if ( err ) {
						log.debug( {
							app: 'webhook',
							action: 'error-creating-payment',
							error: err
						} );
					} else {
						log.info( {
							app: 'webhook',
							action: 'create-payment',
							payment: payment,
							member: member._id
						} );
					}
				} );
			} );
		} else {
			new Payments( payment ).save( function( err ) {
				log.info( {
					app: 'webhook',
					action: 'create-unlinked-payment',
					payment: payment
				} );
			} );
		}
	} );
}

function updatePayment( event ) {
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( ! payment ) return; // There's nothing left to do here.
		payment.status = event.details.cause;
		payment.updated = new Date();
		payment.save( function( err ) {
			if ( err ) {
				log.debug( {
					app: 'webhook',
					action: 'error-updating-payment',
					error: err
				} );
			} else {
				log.info( {
					app: 'webhook',
					action: 'update-payment',
					payment: payment
				} );
			}
		} );
	} );
}

function extendMembership( event ) {
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( ! payment ) return; // There's nothing left to do here.
		if ( payment.member ) {
			Members.findOne( { _id: payment.member } ).populate( 'permissions.permission' ).exec( function( err, member ) {
				var foundPermission = false;
				for ( var p = 0; p < member.permissions.length; p++ ) {
					if ( member.permissions[p].permission.slug == config.permission.member ) {
						foundPermission = true;
						// Create new expiry date 36 days + 12:00:00 ahead
						member.permissions[p].date_expires = new Date();
						member.permissions[p].date_expires.setDate( member.permissions[p].date_expires.getDate() + 37 );
						member.permissions[p].date_expires.setHours( 12 );
						member.permissions[p].date_expires.setMinutes( 0 );
						member.permissions[p].date_expires.setSeconds( 0 );
						member.permissions[p].date_expires.setMilliseconds( 0 );
						log.info( {
							app: 'webhook',
							action: 'extend-membership',
							until: member.permissions[p].date_expires,
							sensitive: {
								member: member._id
							}
						} );
					}
				}
				if ( ! foundPermission ) grantMembership( member );
				if ( foundPermission ) {
					member.save( function ( err ) {
						if ( err ) {
							log.debug( {
								app: 'webhook',
								action: 'error-extending-membership',
								error: err
							} );
						}
					} );
				}
			} );
		}
	} );
}

function grantMembership( member ) {
	Permissions.findOne( { slug: config.permission.member }, function( err, permission ) {
		if ( permission ) {
			var new_permission = {
				permission: permission.id,
				date_added: new Date(),
				date_expires: new Date()
			};
			// Create new expiry date 36 days + 12:00:00 ahead
			new_permission.date_expires.setDate( new_permission.date_expires.getDate() + 37 );
			new_permission.date_expires.setHours( 12 );
			new_permission.date_expires.setMinutes( 0 );
			new_permission.date_expires.setSeconds( 0 );
			new_permission.date_expires.setMilliseconds( 0 );

			log.info( {
				app: 'webhook',
				action: 'grant-membership',
				until: new_permission.date_expires,
				sensitive: {
					member: member._id
				}
			} );

			Members.update( { _id: member._id }, {
				$push: {
					permissions: new_permission
				}
			}, function ( err ) {
				if ( err ) {
					log.debug( {
						app: 'webhook',
						action: 'error-granting-membership',
						error: err
					} );
				} else {
					sendNewMemberEmail( member );
				}

				checkMembershipCap();
			});
		}
	} );
}

setInterval(function () {
	Options.loadFromDb(function (){
		if ( Options.getInt( 'signup-cap' ) > 0 ) {
			if ( ! Options.getBool( 'signup-closed' ) )
			{
				Permissions.find( function( err, permissions ) {
					var filter_permissions = [];
					var member = permissions.filter( function( permission ) {
						if ( permission.slug == config.permission.member ) return true;
						return false;
					} )[0];

					var search = { permissions: {
						$elemMatch: {
							permission: member._id,
							date_added: { $lte: new Date() },
							$or: [
								{ date_expires: null },
								{ date_expires: { $gt: new Date() } }
							]
						}
					} };

					Members.count( search, function( err, total ) {
						if ( total >= Options.getInt( 'signup-cap' ) ) {
							log.info( {
								app: 'webhook',
								action: 'cap-membership',
								total: total,
								cap: Options.getInt( 'signup-cap' )
							} );
							Options.set( 'signup-closed', 'true', function () {} );
							Options.set( 'signup-cap', '0' , function () {});
						}
					} );
				} );
			}
		}
	});
},30*1000);



function sendNewMemberEmail( member ) {
	Mail.sendMail(
		member.email,
		'Welcome to ' + Options.getText( 'organisation' ),
		__views + '/email-templates/new-member.text.pug',
		__views + '/email-templates/new-member.html.pug',
		{
			firstname: member.firstname
		}
	);
}

function handleSubscriptionResourceEvent( event ) {
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
			cancelledSubscription( event );
			break;
	}
}

function cancelledSubscription( event ) {
	Members.findOne( { 'gocardless.subscription_id': event.links.subscription }, function( err, member ) {
		if ( ! member ) {
			log.info( {
				app: 'webhook',
				action: 'unlink-subscription',
				sensitive: {
					subscription_id: event.links.subscription
				}
			} );
			return;
		}

		member.gocardless.subscription_id = '';
		member.gocardless.amount = '';
		member.save( function( err ) {
			if ( err ) {
				log.debug( {
					app: 'webhook',
					action: 'error-removing-subscription-id',
					error: err,
					sensitive: {
						member: member._id,
						subscription_id: event.links.subscription
					}
				} );
			} else {
				log.info( {
					app: 'webhook',
					action: 'remove-subscription-id',
					sensitive: {
						member: member._id,
						subscription_id: event.links.subscription
					}
				} );

			}
		} );
	} );
}

function handleMandateResourceEvent( event ) {
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
			cancelledMandate( event );
			break;
	}
}

function cancelledMandate( event ) {
	Members.findOne( { 'gocardless.mandate_id': event.links.mandate }, function( err, member ) {
		if ( ! member ) {
			log.info( {
				app: 'webhook',
				action: 'unlink-mandate',
				sensitive: {
					mandate_id: event.links.mandate
				}
			} );
			return;
		}
		member.gocardless.mandate_id = '';
		member.gocardless.next_possible_charge_date = '';
		member.save( function( err ) {
			if ( err ) {
				log.debug( {
					app: 'webhook',
					action: 'error-removing-mandate-id',
					error: err,
					sensitive: {
						member: member._id,
						mandate_id: event.links.mandate
					}
				} );
			} else {
				log.info( {
					app: 'webhook',
					action: 'remove-mandate-id',
					sensitive: {
						member: member._id,
						mandate_id: event.links.mandate
					}
				} );

			}
		} );

	} );
}
