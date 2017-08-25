var __root = __dirname + '/../..',
	__src = __root + '/src',
	__models = __src + '/models';

var fs = require( 'fs' ),
	mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId,
	crypto = require( 'crypto' );

exports.ObjectId = ObjectId;
exports.mongoose = mongoose;

exports.connect = function( url ) {
	mongoose.Promise = global.Promise;
	mongoose.connect( url, {
		useMongoClient: true
	} );
	var db = mongoose.connection;
	db.on( 'connected', function( error ) {
		console.log( 'Connected to Mongo database.' );
		console.log();
	} );
	db.on( 'error', function( error ) {
		console.log( 'Error connecting to Mongo database:' );
		console.log( error );
		console.log();
		process.exit();
	} );

	return exports;
};

console.log( 'Loading models:' );

var files = fs.readdirSync( __models );
for ( var f = 0; f < files.length; f++ ) {
	var model = require( __models + '/' + files[f] );
	console.log( '	' + model.name );
	exports[ model.name ] = model.model;
}

console.log();
