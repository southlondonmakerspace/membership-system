var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';
var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var moment = require( 'moment' );

var Mail = require( __js + '/mail' );

var db = require( __js + '/database' ),
	Members = db.Members,
	Events = db.Events,
	Permissions = db.Permissions;

var config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' );

var apps = [];
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	if ( auth.activeMember( req ) ) {
		if ( auth.checkPermission( req, config.permission.access ) ) {
			Permissions.findOne( { slug: config.permission.access }, function ( err, access ) {
				Events.aggregate( [
					{
						$match: {
							happened: { $gte: moment().startOf('month').toDate(), $lt: moment().endOf('month').toDate() },
							permission: access._id,
							member: req.user._id,
							successful: { $ne: false }
						}
					},
					{
						$group: {
							_id: {
								member: "$member",
								day: { $dayOfMonth: "$happened" }
							}
						}
					},
					{
						$group: {
							_id: "$_id.member",
							days: { $push: "$_id.day" }
						}
					},
					{
						$project: {
							_id: 0,
							count: { $size: "$days" }
						}
					},
					{
						$sort: { count: -1 }
					}
				], function ( err, result ) {
					var member = {};
					var permissions = req.user.permissions.filter( function( p ) {
						if ( p.permission && p.permission.slug ) {
							if ( p.permission.slug == config.permission.member ) {
								return true;
							}
						}
						return false;
					} );
					if ( permissions.length > 0 ) member = permissions[0];
					res.render( 'profile', {
						user: req.user,
						count: result,
						membership_expires: ( member.date_expires !== undefined ? member.date_expires : null ),
						membership_amount: ( req.user.gocardless.amount !== undefined ? req.user.gocardless.amount: null )
					} );
				} );
			} );
		} else {
			var member = {};
			var permissions = req.user.permissions.filter( function( p ) {
				if ( p.permission && p.permission.slug ) {
					if ( p.permission.slug == config.permission.member ) {
						return true;
					}
				}
				return false;
			} );
			if ( permissions.length > 0 ) member = permissions[0];
			res.render( 'profile', {
				user: req.user,
				membership_expires: ( member.date_expires !== undefined ? member.date_expires : null )
			} );
		}
	} else {
		res.render( 'profile', { user: req.user } );
	}
} );

// Update Profile
/////////////////

app.get( '/update', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Update"
	} );
	res.render( 'update', { user: req.user } );
} );

app.post( '/update', auth.isLoggedIn, function( req, res ) {
	if ( ! req.body.firstname ||
		 ! req.body.lastname ) {
			req.log.debug( {
				app: 'profile',
				action: 'update',
				error: 'First or last name were not provided',
				sensitive: {
					body: req.body
				}
			} );

			req.flash( 'danger', 'information-ommited' );
			res.redirect( app.mountpath + '/update' );
			return;
	}

	if ( ! req.body.address ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Address was not provided',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-address' );
		res.redirect( app.mountpath + '/update' );
		return;
	}

	if ( req.body.address.split( '\n' ).length <= 2 ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Address did not have enough lines',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-address' );
		res.redirect( app.mountpath + '/update' );
		return;
	}

	var postcode;
	var results = req.body.address.match( /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/ );

	if ( results ) {
		postcode = results[0];
	}

	if ( ! postcode ) {
		req.log.debug( {
			app: 'profile',
			action: 'update',
			error: 'Postcode was invalid or absent',
			sensitive: {
				body: req.body
			}
		} );

		req.flash( 'danger', 'user-postcode' );
		res.redirect( app.mountpath + '/update' );
		return;
	}

	postcodes.lookup( postcode, function( err, data ) {
		var profile = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			address: req.body.address
		};

		if ( data ) {
			profile.postcode_coordinates = {
				lat: data.latitude,
				lng: data.longitude,
			};
		} else {
			profile.postcode_coordinates = null;
		}

		Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
			if ( status ) {
				req.log.debug( {
					app: 'profile',
					action: 'update',
					error: 'Validation errors',
					validation: status.errors,
					sensitive: {
						body: req.body
					}
				} );

				var keys = Object.keys( status.errors );
				for ( var k in keys ) {
					var key = keys[k];
					req.flash( 'danger', status.errors[key].message );
				}
			} else {
				req.log.info( {
					app: 'profile',
					action: 'update',
					sensitive: {
						profile: profile
					}
				} );

				req.flash( 'success', 'profile-updated' );
			}
			res.redirect( app.mountpath );
		} );
	} );


} );

// Emergency Contact
////////////////////

app.get( '/emergency-contact', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Emergency contact"
	} );
	res.render( 'emergency-contact', { user: req.user } );
} );

app.post( '/emergency-contact', auth.isLoggedIn, function( req, res ) {
	var profile = {
		emergency_contact: {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			telephone: req.body.telephone
		}
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status ) {
			req.log.debug( {
				app: 'profile',
				action: 'emergency-contact',
				error: 'Validation errors',
				validation: status.errors,
				sensitive: {
					body: req.body
				}
			} );

			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.log.info( {
				app: 'profile',
				action: 'emergency-contact',
				sensitive: {
					profile: profile
				}
			} );

			req.flash( 'success', 'emergency-contact-updated' );
		}
		res.redirect( app.mountpath );
	} );
} );

// Change Password
//////////////////

app.get( '/change-password', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Change Password"
	} );
	res.render( 'change-password' );
} );

app.post( '/change-password', auth.isLoggedIn, function( req, res ) {
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
			res.redirect( app.mountpath );
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
				res.redirect( app.mountpath + '/change-password' );
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
				res.redirect( app.mountpath + '/change-password' );
				return;
			}

			if ( req.body.new != req.body.verify ) {
				req.log.debug( {
					app: 'profile',
					action: 'change-password',
					error: 'New password does not match verify password field',
				} );
				req.flash( 'danger', 'password-mismatch' );
				res.redirect( app.mountpath + '/change-password' );
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
							res.redirect( app.mountpath );
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
