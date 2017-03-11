var session = require( 'express-session' ),
	config = require( '../../config/config.json' ),
	cookie = require('cookie-parser'),
	passport = require( 'passport' );

var MongoDBStore = require( 'connect-mongodb-session' )( session );

module.exports =  function( app ) {
	var store = new MongoDBStore( {
		uri: config.mongo,
		collection: 'sessions'
	} );
	store.on( 'error', function( error ) {
		console.log( error );
	} );

	app.use( cookie() );
	app.use( session( {
		secret: config.secret,
		cookie: { maxAge: 31*24*60*60*1000 },
		saveUninitialized: false,
		store: store,
		resave: false,
		rolling: true
	} ) );

	app.use( passport.initialize() );
	app.use( passport.session() );
};
