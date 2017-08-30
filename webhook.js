var __config = __dirname + '/config/config.json';
var __static = __dirname + '/static';
var __src = __dirname + '/src';
var __js = __src + '/js';
var __views = __src + '/views';

var config = require( __config ),
	db = require( __dirname + '/src/js/database' ).connect( config.mongo ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	bodyParser = require( 'body-parser' ),
	textBodyParser = bodyParser.text( { type: 'application/json' } ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

var Options = require( __js + '/options' )();

var Members = db.Members,
	Permissions = db.Permissions,
	Payments = db.Payments;

var Mail = require( __js + '/mail' );

console.log( "Starting..." );

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
				res.sendStatus( 498 );
			}
		} );
	} else {
		res.sendStatus( 498 );
	}
} );

// Start server
var listener = app.listen( config.gocardless.port, config.host, function () {
	console.log( "Server started on: " + listener.address().address + ':' + listener.address().port );
} );

function handleResourceEvent( event ) {
	if ( event.resource_type == 'payments' ) {
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
			default:
				console.log( 'Unknown event: ' );
				console.log( event );
		}
	}
}

function createPayment( event ) {
	console.log( 'Payment Created: (' + event.links.payment + ')' );
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
					if ( err ) console.log( err );
				} );
			} );
		} else {
			new Payments( payment ).save( function( err ) {
				console.log( 'Unlinked payment: (' + event.links.payment + ')' );
			} );
		}
	} );
}

function updatePayment( event ) {
	console.log( 'Payment Update: ' + event.action + ' (' + event.links.payment + ')' );
	Payments.findOne( { payment_id: event.links.payment }, function( err, payment ) {
		if ( ! payment ) return; // There's nothing left to do here.
		payment.status = event.details.cause;
		payment.updated = new Date();
		payment.save( function( err ) {
			if ( err ) console.log( err );
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
						console.log( 'Extending "' + member.email + '" membership permission until: ' + member.permissions[p].date_expires );
					}
				}
				if ( ! foundPermission ) grantMembership( member );
				if ( foundPermission ) {
					member.save( function ( err ) {
						if ( err ) {
							console.log( err );
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

			console.log( 'Granting "' + member.email + '" membership permission until: ' + new_permission.date_expires );

			Members.update( { _id: member._id }, {
				$push: {
					permissions: new_permission
				}
			}, function ( err ) {
				if ( err ) {
					console.log( err );
				} else {
					sendNewMemberEmail( member );
				}
			});
		}
	} );
}

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
