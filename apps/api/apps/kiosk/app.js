var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication.js' );

var database = require( __js + '/database' ),
	Members = database.Members;

var app_config = {};

app.get( '/validate/:tag', auth.isAPIAuthenticated, function( req, res ) {
	Members.findOne( { 'tag.hashed': req.params.tag }, function( err, member ) {
		if ( member ) {
			res.json( {
				valid: true
			} );
		} else {
			res.json( {
				valid: false
			} );
		}
	} );
} );

app.get( '/identify/:tag', auth.isAPIAuthenticated, function( req, res ) {
	Members.findOne( { 'tag.hashed': req.params.tag }, function( err, member ) {
		if ( member ) {
			res.json( {
				valid: true,
				firstname: member.firstname,
				lastname: member.lastname,
				// member: output.member,
				gravatar: member.gravatar
			} );
		} else {
			res.json( {
				valid: false
			} );
		}
	} );
} );

app.get( '/enroll', auth.isAPIAuthenticated, function( req, res ) {
	res.json( {
		valid: true
	} );
} );

// app.get( '*', function ( req, res ) {
// 	res.sendStatus( 501 );
// } );

module.exports = function( config ) {
	app_config = config;
	return app;
};
