"use strict";

var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' );

app.set( 'views', __dirname + '/views' );

app.get( '/', function ( req, res ) {
	if ( ! auth.isLoggedIn ) {
		res.render( 'index' );
	} else {
		res.redirect( '/profile' );
	}
} );

module.exports = function( config ) { return app; };
