module.exports = function( app ){

	app.get( '/', function ( req, res ) {

		res.send( 'Hello Makers!!' );
	});

	app.get( '/login' , function( req, res ){

		res.render( 'login', {} );
	} );
}