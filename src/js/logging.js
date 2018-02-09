var __root = '../..';
var __config = __root + '/config/config.json';
var __static = __root + '/static';
var __src = __root + '/src';
var __views = __src + '/views';
var __js = __src + '/js';

var config = require( __config );

var bunyan = require( 'bunyan' ),
	bunyanMiddleware = require( 'bunyan-middleware' ),
	SyslogStream = require( 'bunyan-syslog-unixdgram' )


// Bunyan logging
var bunyanConfig = {
	name: 'Membership-System',
	streams: []
};

if ( config.logStdout != undefined ) {
	bunyanConfig.streams.push(
		{
			level: 'debug',
			stream: process.stdout
		}
	)
}

if ( config.log != undefined ) {
	bunyanConfig.streams.push({
		type: "rotating-file",
		path: config.log,
		period: '1d', // rotates every day
		count: 7 // keeps 7 days
	})
}

if (config.syslog == true) {
	var streamOptions = {
		path: '/var/run/syslog'
	}

	var supported = true;
	switch ( process.platform ) {
		case 'darwin':
			streamOptions.path = '/var/run/syslog';
			break;
		case 'linux':
			streamOptions.path = '/dev/log';
			break;
		default:
			console.error( "syslog output only supported on Linux and OS X" );
			supported = false
	}

	if ( supported ) {
		var stream = new SyslogStream( streamOptions );
		bunyanConfig.streams.push( {
			level: 'debug',
			type: 'raw',
			stream: stream
		} );
	}
}

var requestLogger = bunyan.createLogger( bunyanConfig );

module.exports =  bunyanMiddleware( { logger: requestLogger } );
