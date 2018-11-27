var config = require( __config );

var bunyan = require( 'bunyan' ),
	bunyanMiddleware = require( 'bunyan-middleware' ),
	SyslogStream = require( 'bunyan-syslog-unixdgram' ),
	BunyanSlack = require( 'bunyan-slack' );

var crypto = require('crypto');
var hash = crypto.createHash;
var randomKey = crypto.randomBytes(256);

// Bunyan logging
var bunyanConfig = {
	name: 'Membership-System',
	streams: [],
	serializers: {
		error: bunyan.stdSerializers.err
	}
};

if ( config.logStdout != undefined && config.logStdout == true) {
	bunyanConfig.streams.push(
		{
			level: 'debug',
			stream: process.stderr
		}
	);
	bunyanConfig.streams.push(
		{
			level: 'error',
			stream: process.stderr
		}
	);
}

if ( config.log != undefined ) {
	bunyanConfig.streams.push({
		type: 'file',
		path: config.log
	});
}

if (config.syslog == true) {
	var streamOptions = {
		path: '/var/run/syslog'
	};

	var supported = true;
	switch ( process.platform ) {
	case 'darwin':
		streamOptions.path = '/var/run/syslog';
		break;
	case 'linux':
		streamOptions.path = '/dev/log';
		break;
	default:
		console.error( 'syslog output only supported on Linux and OS X' );
		supported = false;
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

if ( config.logSlack != undefined ) {
	let stream = new BunyanSlack( {
		...config.logSlack,
		customFormatter(record, levelName) {
			const msgPrefix = (config.dev ? '[DEV] ' : '') + `[${levelName.toUpperCase()}] `;

			if (record.error) {
				return {
					text: msgPrefix + record.error.message,
					attachments: [{
						title: 'Stack trace',
						text: record.error.stack
					}]
				};
			} else {
				return {
					text: msgPrefix + record.msg
				};
			}
		}
	} );
	bunyanConfig.streams.push( {
		level: config.logSlack.level,
		stream
	} );
}

var logger = bunyan.createLogger( bunyanConfig );

function loggingMiddleware(req, res, next) {
	var log = req.log;

	const logAThing = level => (params, msg) => {
		params.ip = req.connection.remoteAddress; //TODO: this will only be correct when behind a reverse proxy, if app.set('trust proxy') is enabled!
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
		log[level](params, msg);
		if (params.sensitive)
		{
			delete params.sensitive;
		}
	};

	req.log = {
		info: logAThing('info'),
		debug: logAThing('debug'),
		error: logAThing('error'),
		fatal: logAThing('fatal')
	};
	next();
}

module.exports = {
	installMiddleware: function (app) {
		app.use( bunyanMiddleware( {
			logger: logger,
			filter: req => req.url.startsWith('/static')
		} ) );
		app.use( loggingMiddleware );
	},
	log: logger
};
