var __config = __dirname + '/../config/config.json';
var __src = __dirname + '/../src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	mongoose = database.mongoose;

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var Members = database.Members;

Members.find( function( err, members ) {
	for ( var m in members ) {
		updateMemberPostcode( members[m] );
	}
} );

function updateMemberPostcode( member ) {
	var postcode = '';
	var results = member.address.match( /([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)/ );

	if ( results != undefined ) {
		postcode = results[0];
		postcodes.lookup( postcode, function( err, data ) {
			if ( data != undefined ) {
				member.postcode_coordinates = {
					lat: data.latitude,
					lng: data.longitude,
				}
				member.save( function() {
					console.log( member.postcode_coordinates );
				} );
			}
		} );
	}
}
