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

var crypto = require('crypto')
var hash = crypto.createHash;
var randomKey = crypto.randomBytes(256);

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

var logger = bunyan.createLogger( bunyanConfig );

function loggingMiddleware(req, res, next) {
	var log = req.log;
	function logAThing( level, params, req )
	{
		params.ip = req.ip; //TODO: this will only be correct when behind a reverse proxy, if app.set('trust proxy') is enabled!
		if (! params.sensitive )
		{
			params.sensitive = {};
		}
		if ( req.user ) {
			params.sensitive._user = {
				uuid: req.user.uuid,
				firstname: req.user.firstname,
				lastname: req.user.lastname,
				email: req.user.email
			};
			params.anon_userid = hash('sha1').update(req.user.uuid + randomKey).digest('base64');
		}
		if ( req.sessionID )
		{
			params.sensitive.sessionID = req.sessionID;
			params.anon_sessionId = hash('sha1').update(req.sessionID + randomKey).digest('base64');
		}
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
			logAThing( 'info', params , req );
		},
		debug: function (params)
		{
			logAThing( 'debug', params , req );
		},
		error: function (params)
		{
			logAThing( 'error', params , req );
		},
		fatal: function (params)
		{
			logAThing( 'fatal', params , req );
		}
	}
	next();
}

module.exports = {
	installMiddleware: function (app) {
		app.use( bunyanMiddleware( { logger: logger, level: "trace" } ) );
		app.use( loggingMiddleware );
	},
	log: logger
}
