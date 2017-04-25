var session = require( 'express-session' ),
	config = require( '../../config/config.json' ),
	cookie = require('cookie-parser'),
	body = require( 'body-parser' ),
	passport = require( 'passport' );
	csrf = require( 'csurf' );

var MongoDBStore = require( 'connect-mongodb-session' )( session );

module.exports =  function( app ) {
	// Sessions + Cookies
	var store = new MongoDBStore( {
		uri: config.mongo,
		collection: 'sessions'
	} );
	store.on( 'error', function( error ) {
		console.log( error );
	} );

	app.use( cookie() );
	app.use( session( {
		name: config.session,
		secret: config.secret,
		cookie: config.cookie,
		saveUninitialized: false,
		store: store,
		resave: false,
		rolling: true
	} ) );

	// Form Body Parser
	app.use( body.urlencoded( { extended: true } ) );
	app.use( body.json() );

	// Passport
	app.use( passport.initialize() );
	app.use( passport.session() );

	// CSRF
	app.use( csrf() );

	app.use( function( req, res, next ) {
		res.locals.csrf= req.csrfToken();
		next();
	} );

	app.use( function( err, req, res, next ) {
		if ( err.code == 'EBADCSRFTOKEN' ) return res.sendStatus( 403 );
		next( err );
	} );
};
