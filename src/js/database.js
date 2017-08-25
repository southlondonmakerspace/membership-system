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
	db.on( 'connected', console.error.bind( console, 'Connected to Mongo database.' ) );
	db.on( 'error', console.error.bind( console, 'Error connecting to Mongo database.' ) );

	return exports;
};

console.log( 'Loading database models:' );
var files = fs.readdirSync( __models );
for ( var f = 0; f < files.length; f++ ) {
	var model = require( __models + '/' + files[f] );
	console.log( '	' + model.name );
	exports[ model.name ] = model.model;
}
