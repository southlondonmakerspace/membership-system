var __root = __dirname + '/../..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var config = require( __config ),
	db = require( __js + '/database' ).connect( config.mongo );

var	Permissions = db.Permissions,
	Members = db.Members,
	Payments = db.Payments,
	HistoricEvents = db.HistoricEvents,
	Events = db.Events,
	Activities = db.Activities,
	APIKeys = db.APIKeys;

var data = require( process.argv[2] );

var map = {
	permissions: {},
	activities: {},
	members: {},
	payments: {},
	HistoricEvents: {},
	events: {}
};

console.log( 'Permissions' );
for ( var p in data.permissions ) {
	var permission = data.permissions[p];

	var id = new db.mongoose.Types.ObjectId();
	map.permissions[ permission._id ] = id;
	permission._id = id;

	new Permissions( permission ).save( log );
}

console.log( 'Activities' );
for ( var a in data.activities ) {
	var activity = data.activities[a];

	var id = new db.mongoose.Types.ObjectId();
	map.activities[ activity._id ] = id;
	activity._id = id;

	new Activities( activity ).save( log );
}

console.log( 'Members' );
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

console.log( 'Payments' );
for ( var p in data.payments ) {
	var payment = data.payments[p];

	var id = new db.mongoose.Types.ObjectId();
	map.payments[ payment._id ] = id;
	payment._id = id;

	if ( payment.member ) payment.member = map.members[ payment.member ];

	new Payments( payment ).save( log );
}

console.log( 'HistoricEvents' );
for ( var h in data.HistoricEvents ) {
	var HistoricEvent = data.HistoricEvents[h];

	var id = new db.mongoose.Types.ObjectId();
	map.HistoricEvents[ HistoricEvent._id ] = id;
	HistoricEvent._id = id;

	new HistoricEvents( HistoricEvent ).save( log );
}

console.log( 'Events' );
for ( var e in data.events ) {
	var event = data.events[e];

	var id = new db.mongoose.Types.ObjectId();
	map.events[ event._id ] = id;
	event._id = id;

	if ( event.member ) event.member = map.members[ event.member ];
	if ( event.activity ) event.activity = map.activities[ event.activity ];
	if ( event.permission ) event.permission = map.permissions[ event.permission ];

	new Events( event ).save( log );
}


function log( err ) {
	if ( err )
		console.log( err );
}
