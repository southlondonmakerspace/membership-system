"use strict";

var	express = require( 'express' ),
	app = express();

var auth = require( '../../src/js/authentication.js' ),
	Members = require( '../../src/js/database' ).Members;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Members",
		url: "/members"
	} );
	res.locals.activeApp = 'members';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	Members.find( function( err, members ) {
		res.render( 'index', { members: members } );
	} );
} );

module.exports = app;