var __root = __dirname + '/../..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var fs = require( 'fs' );

if ( ! fs.existsSync( process.argv[2] ) )
	return console.log( 'You need to provide a path to the data you want imported!' );

var config = require( __config ),
	db = require( __js + '/database' ).connect( config.mongo );

var	Permissions = db.Permissions,
	Members = db.Members,
	Payments = db.Payments,
	HistoricEvents = db.HistoricEvents,
	Events = db.Events,
	APIKeys = db.APIKeys;

var map = {
	permissions: {},
	members: {},
	payments: {},
	HistoricEvents: {},
	events: {}
};

var data = {};

db.mongoose.connection.on( 'connected', function() {
	console.log( 'Processing Data' );
	data = fs.readFileSync( process.argv[2] );
	data = JSON.parse( data.toString().replace( /^#.*\n?/gm, '' ) );

	importData();

	console.log( 'Finished import' );
	setTimeout( function () {
		db.mongoose.disconnect();
	}, 1000);
} );

db.mongoose.connection.on( 'disconnected', function() {
	console.log( 'Disconnected from database' );
} );

function importData() {
	if ( data.permissions ) {
		console.log( 'Importing: Permissions - ' + data.permissions.length );
		for ( var p in data.permissions ) {
			var permission = data.permissions[p];

			var id = new db.mongoose.Types.ObjectId();
			map.permissions[ permission._id ] = id;
			permission._id = id;

			new Permissions( permission ).save( log );
		}
	}

	if ( data.members ) {
		console.log( 'Importing: Members - ' + data.members.length );
		for ( var m in data.members ) {
			var member = data.members[m];

			var id = new db.mongoose.Types.ObjectId();
			map.members[ member._id ] = id;
			member._id = id;

			for ( var mp in member.permissions ) {
				var member_permission = member.permissions[mp];
				member_permission._id = new db.mongoose.Types.ObjectId();
				member_permission.permission = map.permissions[ member_permission.permission ];
			}

			new Members( member ).save( log );
		}
	}

	if ( data.payments ) {
		console.log( 'Importing: Payments - ' + data.payments.length );
		for ( var p in data.payments ) {
			var payment = data.payments[p];

			var id = new db.mongoose.Types.ObjectId();
			map.payments[ payment._id ] = id;
			payment._id = id;

			if ( payment.member ) payment.member = map.members[ payment.member ];

			new Payments( payment ).save( log );
		}
	}

	if ( data.HistoricEvents ) {
		console.log( 'Importing: HistoricEvents - ' + data.HistoricEvents.length );
		for ( var h in data.HistoricEvents ) {
			var HistoricEvent = data.HistoricEvents[h];

			var id = new db.mongoose.Types.ObjectId();
			map.HistoricEvents[ HistoricEvent._id ] = id;
			HistoricEvent._id = id;

			new HistoricEvents( HistoricEvent ).save( log );
		}
	}

	if ( data.events ) {
		console.log( 'Importing: Events - ' + data.events.length );
		for ( var e in data.events ) {
			var event = data.events[e];

			var id = new db.mongoose.Types.ObjectId();
			map.events[ event._id ] = id;
			event._id = id;

			if ( event.member ) event.member = map.members[ event.member ];
			if ( event.permission ) event.permission = map.permissions[ event.permission ];

			new Events( event ).save( log );
		}
	}
}

function log( err ) {
	if ( err )
		console.log( err );
}
