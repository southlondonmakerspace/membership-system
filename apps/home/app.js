var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

app.set( 'views', __dirname + '/views' );

app.get( '/', function ( req, res ) {
	if ( auth.loggedIn( req ) == auth.LOGGED_IN ) {
		res.redirect( '/profile' );
	} else {
		res.render( 'index' );
	}
} );

module.exports = function() { return app; };
