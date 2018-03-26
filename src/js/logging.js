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

if ( config.logStdout != undefined && config.logStdout == true) {
	bunyanConfig.streams.push(
		{
			level: 'debug',
			stream: process.stdout
		}
	)
	bunyanConfig.streams.push(
		{
			level: 'error',
			stream: process.stderr
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

function loggingMiddleware(req, res, next) {
	var log = req.log;
	function logAThing( level, params )
	{
		if (params.sensitive)
		{
			log[level](params);
			delete params.sensitive;
		}
		log[level](params);
	}

	req.log = {
		info: function (params)
		{
			logAThing( 'info', params );
		},
		debug: function (params)
		{
			logAThing( 'debug', params );
		},
		error: function (params)
		{
			logAThing( 'error', params );
		},
		fatal: function (params)
		{
			logAThing( 'fatal', params );
		}
	}
	next();
}

var requestLogger = bunyan.createLogger( bunyanConfig );


module.exports = function (app) {
	app.use( bunyanMiddleware( { logger: requestLogger, level: "trace" } ) );
	app.use( loggingMiddleware );
}
