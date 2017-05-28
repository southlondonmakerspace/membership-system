var __root = __dirname + '/../..';
var __config = __root + '/config';
var __src = __root + '/src';
var __js = __src + '/js';

var inquirer = require( 'inquirer' );
var moment = require( 'moment' );

var config = require( __config + '/config.json' );

var	db = require( __js + '/database' ).connect( config.mongo ),
	Permissions = db.Permissions,
	Members = db.Members;

var Auth = require( __js + '/authentication' );

var member, admin, superadmin;

db.mongoose.connection.on( 'connected', function() {
	Permissions.findOne( { 'slug': 'member' }, function( err, permission ) {
		member = permission._id;
	} );

	Permissions.findOne( { 'slug': config.permission.admin }, function( err, permission ) {
		admin = permission._id;
	} );

	Permissions.findOne( { 'slug': config.permission.superadmin }, function( err, permission ) {
		superadmin = permission._id;
	} );

	var questions = [];

	// First Name
	questions.push( {
		type: 'input',
		name: 'firstname',
		message: 'First Name',
		validate: function( s ) {
			return ( s.trim() === '' ? "You must enter a first name" : true );
		}
	} );

	// Last Name
	questions.push( {
		type: 'input',
		name: 'lastname',
		message: 'Last Name',
		validate: function( s ) {
			return ( s.trim() === '' ? "You must enter a last name" : true );
		}
	} );

	// Address
	questions.push( {
		type: 'input',
		name: 'address',
		message: 'Address (Comma seperated lines)',
		validate: function( s ) {
			return ( s.trim() === '' ? "You must enter a address" : true );
		}
	} );

	// Address
	questions.push( {
		type: 'input',
		name: 'email',
		message: 'Email Address',
		validate: function( s ) {
			return ( s.trim() === '' ? "You must enter an email address" : true );
		}
	} );

	// Password
	questions.push( {
		type: 'password',
		name: 'password',
		message: 'Password',
		validate: function( s ) {
			return Auth.passwordRequirements( s );
		}
	} );

	// Member
	questions.push( {
		type: 'list',
		name: 'membership',
		message: 'Would you like to grant membership to the user?',
		choices: [ 'Yes', 'Yes (expires after 1 month)', 'Yes (expired yesterday)', 'No' ],
		default: 'Yes'
	} );

	// Level question
	questions.push( {
		type: 'list',
		name: 'permission',
		message: 'What level of access do you wish to grant this new user?',
		choices: [ 'None', 'Admin', 'Super Admin' ],
		default: 'Super Admin'
	} );

	inquirer.prompt( questions ).then( function( answers ) {
		var user = {
			firstname: answers.firstname,
			lastname: answers.lastname,
			address: answers.address.split( ',' ).map( function( s ) { return s.trim(); } ).join( "\n" ),
			email: answers.email,
			permissions: []
		};

		Auth.generatePassword( answers.password, function( result ) {
			user.password = {};
			user.password.hash = result.hash;
			user.password.salt = result.salt;

			if ( answers.membership != 'No' ) {
				var memberPermission = {
					permission: member
				}

				var now = moment();
				switch ( answers.membership ) {
					case 'Yes':
						memberPermission.date_added = now.toDate();
						break;
					case 'Yes (expires after 1 month)':
						memberPermission.date_added = now.toDate();
						memberPermission.date_expires = now.add( '1', 'months' ).toDate();
						break;
					case 'Yes (expired yesterday)':
						memberPermission.date_expires = now.subtract( '1', 'day' ).toDate();
						memberPermission.date_added = now.subtract( '1', 'months' ).toDate();
						break;
				}
				user.permissions.push( memberPermission );
			}

			if ( answers.permission != 'None' ) {
				var adminPermission = {
					date_added: moment().toDate()
				}

				switch ( answers.permission ) {
					case 'Admin':
						adminPermission.permission = admin;
						break;
					case 'Super Admin':
						adminPermission.permission = superadmin;
						break;
				}
				user.permissions.push( adminPermission );
			}

			new Members( user ).save( function( err ) {
				if ( err ) {
					console.log( 'Unable to create user because of error(s):' );
					console.log( err );
				} else {
					console.log( 'New user created.' );
				}

				setTimeout( function () {
					db.mongoose.disconnect();
				}, 1000);
			} );
		} );
	} );
} );

db.mongoose.connection.on( 'disconnected', function() {
	console.log( 'Disconnected from database' );
} );
