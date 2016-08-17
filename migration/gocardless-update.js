var __config = __dirname + '/../config/config.json';
var __src = __dirname + '/../src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	mongoose = database.mongoose;

var Members = database.Members;
var GoCardless = require( __js + '/gocardless' )( config.gocardless );

Members.find( { 'gocardless.subscription_id': { $exists: true } }, function( err, members ) {
	for ( var m = 0; m < members.length; m++ ) {
		member = members[m];
		GoCardless.getSubscription( member.gocardless.subscription_id, function( err, subscription ) {
			if ( ! err ) {
				this.member.gocardless.mandate_id = subscription.links.mandate;
				this.member.save( function( err ) {
					if ( err )
						console.log( err );
				} )
			}
		}.bind( { member: member } ) );
	}
} );
