"use strict";

var __src = __dirname + '/src';
var __js = __src + '/js';

var Discourse = require( __js + '/discourse' );

console.log( "Starting..." );

Discourse.checkGroups(); // Now and...
setInterval( Discourse.checkGroups, 15*60*1000 ); // ...every 15 minutes
setInterval( Discourse.checkPrimaryGroups, 6*60*60*1000 ); // ...every 6 hours
