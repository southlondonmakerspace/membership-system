var __root = __dirname + '/../..';

var config = require( __root + '/config/config.json' ),
	db = require( __root + '/src/js/database' ).connect( config.mongo ),
	Permissions = db.Permissions,
	Activities = db.Activities;

// Unknown tag
new Activities( {
	name:  'Unknown Tag',
	slug: 'unknown-tag',
	event_name: '',
	admin_only: true
} ).save( function( err ) {
	if ( ! err ) {
		console.log( 'created unknown tag activity' );
	} else {
		console.log( err );
	}
} );

// Member
new Permissions( {
	name: 'Member',
	slug: config.permission.member,
	superadmin_only: true
} ).save( function( err ) {
	if ( ! err ) {
		console.log( 'created member permission' );
	} else {
		console.log( err );
	}
} );

// Admin
new Permissions( {
	name: 'Admin',
	slug: config.permission.admin,
	superadmin_only: true
} ).save( function( err ) {
	if ( ! err ) {
		console.log( 'created admin permission' );
	} else {
		console.log( err );
	}
} );

// Super Admin
new Permissions( {
	name: 'Super Admin',
	slug: config.permission.superadmin,
	superadmin_only: true
} ).save( function( err ) {
	if ( ! err ) {
		console.log( 'created super admin permission' );
	} else {
		console.log( err );
	}
} );

// Access
new Permissions( {
	name: 'Access',
	slug: config.permission.access,
	superadmin_only: true
} ).save( function( err ) {
	if ( ! err ) {
		console.log( 'created access permission' );
	} else {
		console.log( err );
	}
} );

setTimeout( function () {
	db.mongoose.disconnect();
}, 1000);
