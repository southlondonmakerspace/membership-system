var __config = __dirname + '/config/config.json';
var __src = __dirname + '/src';
var __js = __src + '/js';

var config = require( __config ),
	db = require( __dirname + '/src/js/database' ).connect( config.mongo ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

var Members = db.Members;

console.log( "Starting..." );

var api_tasks = [];

Members.find( {
	'gocardless.subscription_id': { $exists: true }
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
					if ( remove ) {
						console.log( 'Removed Subscription:  ' + subscription_id );
						Members.update( { 'gocardless.subscription_id': subscription_id }, { $unset: { 'gocardless.subscription_id': true } }, function() {} );
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
					if ( remove ) {
						console.log( 'Removed Mandate:       ' + mandate_id );
						Members.update( { 'gocardless.mandate_id': mandate_id }, { $unset: { 'gocardless.mandate_id': true } }, function() {} );
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
