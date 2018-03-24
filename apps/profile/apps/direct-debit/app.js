var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	request = require( 'request' );

var config = require( __config + '/config.json' ),
	Options = require( __js + '/options.js' )();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members;

var GoCardless = require( __js + '/gocardless' )( config.gocardless );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	if ( Options.getBool( 'signup-closed' ) && ! req.user.signup_override ) {
		res.render( 'signup-closed', {
			show_cancel_mandate: ( req.user.gocardless.mandate_id || req.user.gocardless.subscription_id ? true : false )
		} );
		return;
	}

	var hasMandate = false;
	var hasSubscription = false;

	if ( req.user.gocardless.mandate_id ) hasMandate = true;
	if ( req.user.gocardless.subscription_id ) hasSubscription = true;

	if ( req.query.redirect_flow_id ) {
		if ( req.user.gocardless.redirect_flow_id == req.query.redirect_flow_id ) {
			GoCardless.completeRedirectFlow( req.query.redirect_flow_id, req.user.gocardless.session_token, function( error, mandate_id, body ) {
				if ( error ) {
					req.flash( 'danger', 'gocardless-mandate-err' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} else {
					GoCardless.getMandate( mandate_id, function( error, mandate ) {
						Members.update( { _id: req.user._id }, {
							$set: {
								"gocardless.mandate_id": mandate_id,
								"gocardless.next_possible_charge_date": new Date( mandate.next_possible_charge_date ),
								"gocardless.redirect_flow_id": null
							}
						}, function ( err ) {} );
						req.flash( 'success', 'gocardless-mandate-success' );
						res.redirect( app.parent.mountpath + app.mountpath );
					} );
				}
			} );
			return;
		} else {
			req.flash( 'danger', 'gocardless-mandate-err' );
			res.redirect( app.parent.mountpath + app.mountpath );
		}
	}

	if ( ! hasMandate && ! hasSubscription ) {
		res.render( 'setup-mandate' );
	} else if ( hasMandate && ! hasSubscription ) {
		var dates = [];
		for ( var d = 1; d <= 28; d++ ) dates.push( d );

		var next_possible_charge_date;
		if ( req.user.gocardless.next_possible_charge_date !== undefined )
			next_possible_charge_date = req.user.gocardless.next_possible_charge_date.getDate();

		res.render( 'setup-subscription', {
			amount: ( req.user.gocardless.minimum ? req.user.gocardless.minimum : Options.getText( 'gocardless-minimum' ) ),
			next_possible_charge_date: next_possible_charge_date,
			dates: dates
		} );
	} else {
		res.render( 'complete', { amount: req.user.gocardless.amount } );
	}
} );

app.get( '/setup-mandate', auth.isLoggedIn, function( req, res ) {
	if ( Options.getBool( 'signup-closed' ) && req.user.signup_override === undefined ) {
		req.flash( 'warning', 'signup-closed' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.user.gocardless.mandate_id ) {
		auth.generateActivationCode( function( session_token ) {
			GoCardless.createRedirectFlow( 'Membership + Payments', session_token, config.audience + app.parent.mountpath + app.mountpath, function( error, redirect_url, body ) {
				if ( error ) {
					req.flash( 'danger', 'gocardless-mandate-err' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} else {
					Members.update( { _id: req.user._id }, { $set: { "gocardless.session_token": session_token, "gocardless.redirect_flow_id": body.redirect_flows.id } }, function ( err ) {
						res.redirect( redirect_url );
					} );
				}
			} );
		} );
	} else {
		req.flash( 'warning', 'gocardless-mandate-exists' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.get( '/cancel-mandate', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.mandate_id ) {
		res.render( 'cancel-mandate' );
	} else {
		req.flash( 'warning', 'gocardless-mandate-404' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/cancel-mandate', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.mandate_id ) {
		GoCardless.cancelMandate( req.user.gocardless.mandate_id, function( error, status, body ) {
			Members.update( { _id: req.user._id }, { $unset: {
				'gocardless.mandate_id': true,
				'gocardless.next_possible_charge_date': true,
				'gocardless.subscription_id': true,
				'gocardless.amount': true
			} }, function( err ) {} );
			if ( error ) {
				req.flash( 'danger', 'gocardless-mandate-cancellation-err' );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				if ( status ) {
					req.flash( 'success', 'gocardless-mandate-cancelled' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} else {
					req.flash( 'danger', 'gocardless-mandate-cancellation-err' );
					res.redirect( app.parent.mountpath + app.mountpath );
				}
			}
		} );
	} else {
		req.flash( 'danger', 'gocardless-mandate-cancellation-err' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/create-subscription', auth.isLoggedIn, function( req, res ) {
	if ( Options.getBool( 'signup-closed' ) && req.user.signup_override === undefined ) {
		req.flash( 'warning', 'signup-closed' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.user.gocardless.subscription_id ) {
		if ( ! req.body.amount ||
		 	 ! req.body.day_of_month ) {
			req.flash( 'danger', 'information-ommited' );
			res.redirect( app.parent.mountpath );
			return;
		}
		var min = ( req.user.gocardless.minimum ? parseInt( req.user.gocardless.minimum ): Options.getInt( 'gocardless-minimum' ) );

		if ( parseInt( req.body.amount ) < min ) {
			req.flash( 'danger', Options.getText( 'flash-gocardless-subscription-min' ).replace( '%', min ) );
			return res.redirect( app.parent.mountpath + app.mountpath );
		}

		var day_of_month = parseInt( req.body.day_of_month );

		if ( day_of_month.isNaN || day_of_month > 28 || day_of_month < -1 ) {
			req.flash( 'danger', 'gocardless-subscription-invalid-day' );
			return res.redirect( app.parent.mountpath + app.mountpath );
		}

		GoCardless.createSubscription( req.user.gocardless.mandate_id, req.body.amount, req.body.day_of_month, 'Membership', {}, function( error, subscription_id, body, amount ) {
			if ( error ) {
				req.flash( 'danger', 'gocardless-subscription-err' );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				Members.update( { _id: req.user._id }, { $set: {
					"gocardless.subscription_id": subscription_id,
					'gocardless.amount': req.body.amount
				}, $unset: {
					'signup_override': true
				} }, function ( err ) {
					req.flash( 'success', 'gocardless-subscription-success' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} );
			}
		} );
	} else {
		req.flash( 'warning', 'gocardless-subscription-exists' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.get( '/cancel-subscription', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.subscription_id ) {
		res.render( 'cancel-subscription' );
	} else {
		req.flash( 'warning', 'gocardless-subscription-404' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

app.post( '/cancel-subscription', auth.isLoggedIn, function( req, res ) {
	if ( req.user.gocardless.subscription_id ) {
		GoCardless.cancelSubscription( req.user.gocardless.subscription_id, function( error, status, body ) {
			Members.update( { _id: req.user._id }, { $unset: {
				'gocardless.subscription_id': true,
				'gocardless.amount': true
			} }, function( err ) {} );
			if ( error ) {
				req.flash( 'danger', 'gocardless-subscription-cancellation-err' );
				res.redirect( app.parent.mountpath + app.mountpath );
			} else {
				if ( status ) {
					req.flash( 'success', 'gocardless-subscription-cancelled' );
					res.redirect( app.parent.mountpath + app.mountpath );
				} else {
					req.flash( 'danger', 'gocardless-subscription-cancellation-err' );
					res.redirect( app.parent.mountpath + app.mountpath );
				}
			}
		} );
	} else {
		req.flash( 'danger', 'gocardless-subscription-cancellation-err' );
		res.redirect( app.parent.mountpath + app.mountpath );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
