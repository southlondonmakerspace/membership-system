var session = require( 'express-session' ),
	config = require( '../../config/config.json' ),
	cookie = require('cookie-parser'),
	passport = require( 'passport' );
	csrf = require( 'csurf' );

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
		name: 'slmsMSSession',
		secret: config.secret,
		cookie: config.cookie,
		saveUninitialized: false,
		store: store,
		resave: false,
		rolling: true
	} ) );

	app.use( passport.initialize() );
	app.use( passport.session() );

	app.use( csrf );
	app.use( function( req, res, next ) {
		res.locals._csrf = req.csrfToken();
		next();
	} );
};
