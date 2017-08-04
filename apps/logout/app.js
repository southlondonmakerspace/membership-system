var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

app.get( '/' , function( req, res ) {
	delete req.session.method;
	delete req.session.userSetupShown;
	req.logout();
	req.flash( 'success', 'logged-out' );
	res.redirect( '/' );
} );

module.exports = function() { return app; };
