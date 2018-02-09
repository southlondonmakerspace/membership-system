var __root = __dirname + '/..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config ),
	db = require( __js + '/database' ).connect( config.mongo ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

var Members = db.Members;

console.log( "Starting..." );

var api_tasks = [];

Members.find( { $or:
	[
		{ 'gocardless.subscription_id': { $exists: true } },
		{ 'gocardless.mandate_id': { $exists: true } },
	]
}, function( err, members ) {
	for ( var m = 0; m < members.length; m++ ) {
		var member = members[m];
		if ( member.gocardless.subscription_id ) {
			api_tasks.push( function() {
				var subscription_id = this.subscription_id;
				console.log( 'Checking Subscription: ' + subscription_id );
				GoCardless.getSubscription( subscription_id, function( err, subscription ) {
					var remove = false;
					if ( subscription && subscription.status == 'cancelled' ) remove = true;
					if ( err && err.error && err.error.message == 'Resource not found' ) remove = true;
					if ( ! subscription ) remove = true;
					if ( remove ) {
						console.log( 'Removed Subscription:  ' + subscription_id );
						Members.update( { 'gocardless.subscription_id': subscription_id }, { $unset: { 'gocardless.subscription_id': true, 'gocardless.amount': true } }, function() {} );
					} else {
						subscription.amount /= 100;
						console.log( 'Updating subscription amount to: £' + subscription.amount + ' for ID: ' + subscription_id );
						Members.update( { 'gocardless.subscription_id': subscription_id }, { $set: { 'gocardless.amount': subscription.amount } }, function() {} );
					}
				} );
			}.bind( { subscription_id: member.gocardless.subscription_id } ) );
		}
		if ( member.gocardless.mandate_id ) {
			api_tasks.push( function() {
				var mandate_id = this.mandate_id;
				console.log( 'Checking Mandate:      ' + mandate_id );
				GoCardless.getMandate( mandate_id, function( err, mandate ) {
					var remove = false;
					if ( mandate && mandate.status == 'cancelled' ) remove = true;
					if ( err && err.error && err.error.message == 'Resource not found' ) remove = true;
					if ( ! mandate ) remove = true;
					if ( remove ) {
						console.log( 'Removed Mandate:       ' + mandate_id );
						Members.update( { 'gocardless.mandate_id': mandate_id }, { $unset: { 'gocardless.mandate_id': true, 'gocardless.next_possible_charge_date': true } }, function() {} );
					}
				} );
			}.bind( { mandate_id: member.gocardless.mandate_id } ) );
		}
	}
} );

setInterval( function() {
	if ( api_tasks.length > 0 )
		api_tasks.pop()();
}, 100 );
