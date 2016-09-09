var __config = __dirname + '/../config/config.json';
var __src = __dirname + '/../src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	mongoose = database.mongoose;

var Members = database.Members,
	Permissions = database.Permissions;
var GoCardless = require( __js + '/gocardless' )( config.gocardless );

// Figure out permissions
var director, keyholder, door, laser, beta, membership;
Permissions.find( function ( err, permissions ) {
	for ( var p = 0; p < permissions.length; p++ ) {
		var permission = permissions[p];
		switch( permission.slug ) {
			case 'director':
				director = permission._id;
				break;
			case 'keyholder':
				keyholder = permission._id;
				break;
			case 'door':
				door = permission._id;
				break;
			case 'laser-cutter':
				laser = permission._id;
				break;
			case 'beta-member':
				beta = permission._id;
				break;
			case 'member':
				membership = permission._id;
				break;
		}
	}
} )

var userSchema = mongoose.Schema( {
	name: String,
	uuid: String,
	email: String,
	address: String, // users physical address
	card_id: String, // the ID of the NFC card
	card_id_hashed: String, // the MD5 hash of the card id with salt
	disabled: Boolean, // for when the user wants to disable their account (self)
	approved: Boolean, // used for when an an administrator wishes to disable the account (admin)
	gc_subscription: String, // for when a GoCardless subscription has been set up
	gc_donation: String, // for when a GoCardless subscription has been set up
	last_payment: Date, // when the last payment was received
	membership_expires: Date, // when the last payment was received
	joined: Date, // when the account was created (not their first payment)
	last_accessed: Date, // when they last accessed the website
	last_entered: Date, // last recorded that they went in to the space
	last_updated: Date, // last time any entry was updated
	permission: Number // permission level. 0 is none, 50 is admin
} );

var Users = mongoose.model( 'Users', userSchema, 'User' );

Users.find( function( err, users ) {
	for ( var u = 0; u < users.length; u++ ) {
		var user = users[u];
		var member = {
			_id: user._id,
			uuid: user.uuid,
			activated: true,
			password: {
				hash: '-',
				salt: '-'
			},
			email: user.email,
			address: user.address,
			joined: user.joined
		};

		// Name
		var name = user.name.trim().split( ' ' );
		member.firstname = name.shift();
		if ( name.length > 0 ) {
			member.lastname = name.join( ' ' );
		} else {
			member.lastname = ' ';
		}

		// Tag
		if ( user.card_id ) {
			member.tag = {};
			member.tag.id = user.card_id;
			member.tag.hashed = user.card_id_hashed;
		}

		// Permissions
		member.permissions = [];
		if ( user.permission >= 50 )
			member.permissions.push( createPermission( director ) );
		if ( user.permission >= 20 )
			member.permissions.push( createPermission( keyholder ) );
		if ( user.permission >= 10 )
			member.permissions.push( createPermission( door ) );
		if ( user.permission == 11 ||
			 user.permission == 12 ||
			 user.permission == 21 ||
			 user.permission == 22 )
			 member.permissions.push( createPermission( laser ) );
		if ( user.gc_donation != null )
			member.permissions.push( createPermission( beta ) );
		if ( user.membership_expires >= new Date() )
			member.permissions.push( createPermission( membership ) );

		// GoCardless
		if ( user.gc_subscription ) {
			member.gocardless = {};
			member.gocardless.subscription_id = user.gc_subscription;
		}

		new Members( member ).save( function( status ) {
			if ( status != null )
				console.log( status );
		} );
	}
} );

function createPermission( id ) {
	var output = {
		permission: id,
		date_added: new Date()
	};

	if ( id == membership ) {
		var future = new Date();
		future.setDate( future.getDate() + 36 );
		output.date_expires = future;
	}

	return output;
}
