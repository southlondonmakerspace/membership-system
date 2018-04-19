var __root = __dirname + '/..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

var subscriptions = [];
var statuses = {
	pending_customer_approval: "Pending customer approval",
	customer_approval_denied: "Customer approval denied",
	active: "Active",
	finished: "Finished",
	cancelled: "Cancelled"
}

console.log( 'Getting subscription data' );
console.log( '--------------------------------' );
getSubscriptions();
function getSubscriptions( next ) {
	GoCardless.listSubscriptions( 500, next, function( error, response, meta ) {
		for ( r in response ) {
			var subscription = response[r];
			subscriptions.push( subscription );
		}
		if ( meta.cursors.after ) {
			getSubscriptions( meta.cursors.after );
		} else {
			finished();
		}
	} );
}

function finished() {
	for ( s in statuses ) {
		filterAndTotal( s, statuses[s] )
	}
	console.log( '--------------------------------' );
	console.log( 'Total subscriptions: ' + subscriptions.length );
}

function filterAndTotal( filter, text ) {
	var filtered = subscriptions.filter( function( sub ) {
		if ( sub.status == filter ) return true;
		return false;
	} );
	var text = ' – ' + text + ' subscriptions';
	var length = filtered.length.toString();
	switch( length.length ) {
		case 1:
			length += '   ';
			break;
		case 2:
			length += '  ';
			break;
		case 3:
			length += ' ';
			break;
	}
	console.log( length + text );
}
