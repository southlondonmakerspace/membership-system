var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var	express = require( 'express' ),
	app = express();

var	Members = require( __js + '/database' ).Members;

const { wrapAsync } = require( __js + '/utils' );
const { hasSchema } = require( __js + '/middleware' );
const mandrill = require( __js + '/mandrill' );
const Options = require( __js + '/options' )();

const { getResetCodeSchema, resetPasswordSchema } = require( './schemas.json');

var auth = require( __js + '/authentication' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isNotLoggedIn );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'index' );
} );

app.post( '/', hasSchema(getResetCodeSchema).orFlash, wrapAsync( async function( req, res ) {
	const { body: { email } } = req;

	const member = await Members.findOne( { email } );

	if (member) {
		const code = auth.generateCode();
		member.password.reset_code = code;
		await member.save();

		await mandrill.sendToMember('reset-password', member);
	}

	Options.get( 'flash-password-reset', message => {
		req.flash( 'info', message.value.replace( '%', email ) );
		res.redirect( app.mountpath );
	} );
} ) );

app.get( '/code', function( req, res ) {
	res.render( 'change-password' );
} );

app.get( '/code/:password_reset_code', function( req, res ) {
	res.render( 'change-password', { password_reset_code: req.params.password_reset_code } );
} );

app.post( '/change-password', hasSchema(resetPasswordSchema).orFlash, wrapAsync( async function( req, res ) {
	const member = await Members.findOne( { 'password.reset_code': req.body.password_reset_code } );
	const password = await auth.generatePasswordPromise( req.body.password );

	await member.update( { $set: {
		'password.salt': password.salt,
		'password.hash': password.hash,
		'password.reset_code': null,
		'password.tries': 0,
		'password.iterations': password.iterations
	} } );

	req.login( member, function( ) {
		req.flash( 'success', 'password-changed' );
		res.redirect( '/' );
	} );
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
