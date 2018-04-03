var __root = __dirname + '/../..',
	__src = __root + '/src',
	__js = __src + '/js',
	__models = __src + '/models';

var fs = require( 'fs' ),
	path = require( 'path' ),
	mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId,
	crypto = require( 'crypto' );

var log = require( __js + '/logging' ).log;

exports.ObjectId = ObjectId;
exports.mongoose = mongoose;

exports.connect = function( url ) {
	mongoose.Promise = global.Promise;
	mongoose.connect( url, {
		useMongoClient: true
	} );
	var db = mongoose.connection;
	db.on( 'connected', function( error ) {
		log.debug( {
			app: 'database',
			action: 'connect',
			message: 'Connected to Mongo database'
		} );
	} );
	db.on( 'error', function( error ) {
		log.debug( {
			app: 'database',
			action: 'connect',
			message: 'Error connecting to Mongo database',
			error: error
		} );
		process.exit();
	} );

	return exports;
};

var files = fs.readdirSync( __models );
for ( var f = 0; f < files.length; f++ ) {
	var file = __models + '/' + files[f];
	if ( path.extname( file ) == '.js' ) {
		var model = require( file );
		log.debug( {
			app: 'database',
			action: 'load-model',
			model: model.name
		} );
		exports[ model.name ] = model.model;
	}
}
