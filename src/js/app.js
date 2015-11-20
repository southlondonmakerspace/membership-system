var	express = require( 'express'),
	config = require( '../../config/config.json' );

var site = express();

site.get( '/', function ( req, res ) {

	res.send( 'Hello Makers!' );
});

site.listen( config.port );
