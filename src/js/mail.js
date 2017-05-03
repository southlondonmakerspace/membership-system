var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config/config.json';

var config = require( __config );

var pug = require( 'pug' );
var nodemailer = require( 'nodemailer' );

var Mail = {
	sendMail: function ( to, subject, text, html, options, cb ) {
		var message = {};

		options.config = config;

		message.text = pug.renderFile( text, options );
		message.html = pug.renderFile( html, options );

		var transporter = nodemailer.createTransport( config.smtp.url );

		message.from = config.smtp.from;
		message.to = to;
		message.subject = subject + ' – ' + config.globals.organisation;

		cb();

		transporter.sendMail( message, function( err, info ) {
			if ( err ) {
				console.log( 'Error sending email "' + subject + '" to ' + to + ": " );
				console.log( err );
			} else {
				console.log( 'Email "' + subject + '" sent to ' + to );
			}
		} );
	}
};

module.exports = Mail;
