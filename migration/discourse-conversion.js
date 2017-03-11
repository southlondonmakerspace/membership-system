var __config = __dirname + '/../config/config.json';
var __src = __dirname + '/../src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	mongoose = database.mongoose;

var Members = database.Members;

var Discourse = require( __js + '/discourse' );

var checkForMembersTimer;
var membersToUpdate = [];

Members.find( function( err, members ) {
	for ( var m = 0; m < members.length; m++ ) {
		var member = members[m];
		if (  member.discourse.activated ) {
			membersToUpdate.push( member );
		}
	}
	checkForMembersTimer = setInterval( function() {
		if ( membersToUpdate.length > 0 )
			updateDiscourseUsername( membersToUpdate.pop() );
	}, 1000 );
} );

function updateDiscourseUsername( member ) {
	Discourse.searchUsers( member.discourse.email, function( users ) {
		if ( users !== undefined && users.length == 1 ) {
			member.discourse.username = users[0].username;
			member.save( function ( err ) {
				if ( err )
					console.log( err );
				console.log( member.discourse );
			} );
		}
	} );
}
