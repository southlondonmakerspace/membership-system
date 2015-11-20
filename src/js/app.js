var	express = require( 'express' );

var site = express();


site.get( '/', function ( req, res ) {

	res.send( 'Hello Makers!' );
});

site.listen( 3001 );
