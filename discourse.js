var __config = __dirname + '/config/config.json';
var __src = __dirname + '/src';
var __js = __src + '/js';

var config = require( __config ),
	database = require( __js + '/database' ).connect( config.mongo ),
	Discourse = require( __js + '/discourse' );

var log = require( __js + '/logging' ).log;
log.info( {
	app: 'discourse',
	action: 'start'
} );

Discourse.checkGroups(); // Now and...
setInterval( Discourse.checkGroups, 15*60*1000 ); // ...every 15 minutes
setInterval( Discourse.checkPrimaryGroups, 6*60*60*1000 ); // ...every 6 hours
