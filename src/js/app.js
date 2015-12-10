var config = require( '../../config/config.json' );

var mongoose = require( 'mongoose' );

var	express = require( 'express' ),
	flash = require( 'express-flash' ),
	session = require( 'express-session' ),
	body = require('body-parser'),
	cookie = require('cookie-parser'),
	swig = require( 'swig' ),
	app = express(),
	http = require( 'http' ).Server( app );

var passport = require( 'passport' ),
	PersonaStrategy = require( 'passport-persona' ).Strategy;

// Add support for persona authentication
passport.use( new PersonaStrategy( { audience: 'http://localhost:3001' },
	function( email, done ) {
	    process.nextTick(function () {
	    	if ( config.users.indexOf( email ) != -1 )
				return done( null, { email: email }, { message: 'User login successful' } );
			return done( null, false, { message: 'Unauthorised user' } );
		} );
	}
) );

passport.serializeUser( function( user, done ) {
	done( null, user.email );
} );

passport.deserializeUser( function( email, done ) {
	done(null, { email: email });
} );

// Setup static route
app.use( express.static( __dirname + '../../../static' ) );

// Enable support for form post data
app.use( body.json() );
app.use( body.urlencoded( { extended: true } ) );

// Add support for sessions
app.use( cookie() );
app.use( session( {
	secret: config.secret,
	cookie: { maxAge: 60000 },
	saveUninitialized: false,
	resave: false,
	rolling: true
} ) );

// Include support for notifications
app.use( flash() );
app.use( function( req, res, next ) {
	var flash = req.flash();
	var flashes = [];
	var types = Object.keys( flash );
	for ( t in types ) {
		var key = types[t];
		var messages = flash[key];
		for ( m in messages ) {
			var message = messages[m];
			flashes.push( {
				type: key == 'error' ? 'danger' : key,
				message: message
			} );
		}
	}
	res.locals.flashes = flashes;
	next();
} )

// Include support for passport and sessions
app.use( passport.initialize() );
app.use( passport.session() );

// Load in local variables such as config.globals
app.use( function( req, res, next ) {
	res.locals.config = config.globals;
	next();
} );

// Use SWIG to rener pages
app.engine( 'swig', swig.renderFile );
app.set( 'views', __dirname + './../views' );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false ); // Disables cache
swig.setDefaults( { cache: false } ); // Disables cache

// Generic routes
var routes = require( './routes' )( app );

// Start server
app.listen( config.port );