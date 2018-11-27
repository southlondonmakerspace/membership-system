var fs = require( 'fs' ),
	path = require( 'path' ),
	mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

var log = require( __js + '/logging' ).log;

exports.ObjectId = ObjectId;
exports.mongoose = mongoose;

exports.connect = function( url ) {
	mongoose.Promise = global.Promise;
	mongoose.connect( url, { useNewUrlParser: true } );
	var db = mongoose.connection;
	db.on( 'connected', function() {
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
