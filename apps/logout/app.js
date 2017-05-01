var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var messages = require( __src + '/messages.json' );

app.get( '/' , function( req, res ) {
	delete req.session.method;
	req.logout();
	req.flash( 'success', messages['logged-out'] );
	res.redirect( '/' );
} );

module.exports = function() { return app; };
