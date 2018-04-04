var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config/config.json';

var log = require( __js + '/logging' ).log;

var config = require( __config );
var Options = require( __js + '/options' )();

var pug = require( 'pug' );
var nodemailer = require( 'nodemailer' );

var Mail = {
	sendMail: function ( to, subject, text, html, options, cb ) {
		var message = {};

		options.config = config;
		options.Options = Options.getText;
		options.basedir = __dirname + '/' + __root;

		message.text = pug.renderFile( text, options );
		message.html = pug.renderFile( html, options );

		var transporter = nodemailer.createTransport( config.smtp.url );

		message.from = config.smtp.from;
		message.to = to;
		message.subject = subject + ' – ' + Options.getText( 'organisation' );

		transporter.sendMail( message, function( err, info ) {
			var status;

			if ( err ) {
				status = false;
				log.debug( {
					app: 'mail',
					action: 'error-sending-mail',
					error: err,
					sensitive: {
						message
					}
				} );
			} else {
				status = true;
				log.debug( {
					app: 'mail',
					action: 'send-mail',
					sensitive: {
						message
					}
				} );
			}

			if ( typeof cb == 'function' )
				cb( status );
		} );
	}
};

module.exports = Mail;
