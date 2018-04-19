var __root = __dirname + '/..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config ),
	GoCardless = require( __js + '/gocardless' )( config.gocardless );

var mandates = [];
var statuses = {
	pending_customer_approval: "Pending customer approval",
	pending_submission: "Pending submission",
	submited: "Submitted to customer bank",
	active: "Active",
	failed: "Failed",
	cancelled: "Cancelled",
	expired: "Expired"
}

console.log( 'Getting mandate data' );
console.log( '--------------------------------' );
getMandates();
function getMandates( next ) {
	GoCardless.listMandates( 500, next, function( error, response, meta ) {
		for ( r in response ) {
			var mandate = response[r];
			mandates.push( mandate );
		}
		if ( meta.cursors.after ) {
			getMandates( meta.cursors.after );
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
	console.log( 'Total mandates: ' + mandates.length );
}

function filterAndTotal( filter, text ) {
	var filtered = mandates.filter( function( man ) {
		if ( man.status == filter ) return true;
		return false;
	} );
	var text = ' – ' + text + ' mandates';
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
