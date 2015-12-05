var	express = require( 'express'),
	config = require( '../../config/config.json');
	app = express(),
	swig = require( 'swig' );


app.engine( 'html', swig.renderFile );
app.set( 'view engine', 'html' );
app.set( 'views', __dirname + '/../views' );

var routes = require( './routes' )( app );


app.listen( config.port );
