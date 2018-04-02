var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	db = require( __js + '/database' ),
	Members = db.Members;

var Mail = require( __js + '/mail' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Change Password"
	} );
	res.render( 'index' );
} );

app.post( '/', auth.isLoggedIn, function( req, res ) {
	if ( ! req.body.current ||
		 ! req.body.new ||
		 ! req.body.verify ) {
			req.log.debug( {
				app: 'profile',
				action: 'change-password',
				error: 'Validation errors',
				sensitive: {
					body: req.body
				}
			} );
			req.flash( 'danger', 'information-ommited' );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
	}
	Members.findOne( { _id: req.user._id }, function( err, user ) {
		auth.hashPassword( req.body.current, user.password.salt, user.password.iterations, function( hash ) {
			if ( hash != user.password.hash ) {
				req.log.debug( {
					app: 'profile',
					action: 'change-password',
					error: 'Current password does not match users password',
				} );
				req.flash( 'danger', 'password-invalid' );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.new );
			if ( passwordRequirements !== true ) {
				req.log.debug( {
					app: 'profile',
					action: 'change-password',
					error: passwordRequirements,
				} );
				req.flash( 'danger', passwordRequirements );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			if ( req.body.new != req.body.verify ) {
				req.log.debug( {
					app: 'profile',
					action: 'change-password',
					error: 'New password does not match verify password field',
				} );
				req.flash( 'danger', 'password-mismatch' );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			auth.generatePassword( req.body.new, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					'password.salt': password.salt,
					'password.hash': password.hash,
					'password.iterations': password.iterations,
					'password.reset_code': null,
				} }, function( status ) {
					req.log.info( {
						app: 'profile',
						action: 'change-password'
					} );

					var options = {
						firstname: user.firstname
					};

					Mail.sendMail(
						user.email,
						'Password Changed',
						__dirname + '/email-templates/password-changed.text.pug',
						__dirname + '/email-templates/password-changed.html.pug',
						options,
						function() {
							req.flash( 'success', 'password-changed' );
							res.redirect( app.parent.mountpath + app.mountpath );
					} );
				} );
			} );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
