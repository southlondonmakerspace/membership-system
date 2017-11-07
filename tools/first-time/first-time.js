var __root = __dirname + '/../..';

var config = require( __root + '/config/config.json' ),
	db = require( __root + '/src/js/database' ).connect( config.mongo ),
	Permissions = db.Permissions;

// Member
new Permissions( {
	name: 'Member',
	slug: config.permission.member
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
	slug: config.permission.admin
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
	slug: config.permission.superadmin
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
	slug: config.permission.access
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
