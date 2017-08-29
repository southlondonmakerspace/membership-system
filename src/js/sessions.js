var __root = '../..';
var __config = __root + '/config/config.json';

var session = require( 'express-session' ),
	config = require( __config ),
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
	app.use( function( req, res, next ) {
		if ( req.url.match( /^\/api/i ) ) {
			next();
		} else {
			csrf()( req, res, next );
		}
	} );

	app.use( function( err, req, res, next ) {
		if ( err.code == 'EBADCSRFTOKEN' ) {
			return res.status( 403 ).send( 'Error: Please make sure cookies are enabled. (CSRF token invalid)' );
		}
		next( err );
	} );
};
