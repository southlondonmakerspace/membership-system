var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' ),
	Mail = require( __js + '/mail' ),
	Options = require( __js + '/options' )();

var database = require( __js + '/database' ),
	Members = database.Members,
	Enroll = database.Enroll;

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

	if ( ! req.query.tag || ! req.query.email ) {
		return res.json( {
			error: Options.getText( 'flash-information-ommited' )
		} );
	}

	var validateTag = auth.validateTag( req.query.tag );
	if ( validateTag ) {
		return res.json( {
			error: Options.getText( 'flash-' + validateTag )
		} );
	}
	Members.findOne( { 'tag.id': req.query.tag }, function( err, member ) {
		if ( member ) {
			return res.json( {
				error: Options.getText( 'flash-enroll-dupe' )
			} );
		}

		Enroll.findOne( { tag: req.query.tag } ).remove().exec();//, function( err, record ) {
			auth.generateActivationCode( function( code ) {
				new Enroll( {
					tag: req.query.tag,
					code: code
				} ).save( function( status ) {
					if ( status ) {
						return res.json( {
							error: Options.getText( 'flash-enroll-error' )
						} );
					}
					Mail.sendMail(
						req.query.email,
						'Enroll Tag',
						__dirname + '/email-templates/enroll.text.pug',
						__dirname + '/email-templates/enroll.html.pug',
						{
							enroll_url: config.audience + '/profile/enroll/' + code
						},
						function() {
							res.json( {
								error: false
							} );
						}
					);
				} );
			} );
		// } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
