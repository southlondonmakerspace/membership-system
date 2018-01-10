var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var apps = [];
var app_config = {};

var auth = require( __js + '/authentication' );

var	db = require( __js + '/database' ),
	Inductions = db.Inductions,
	Members = db.Members;

var moment = require( 'moment' );

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

/*
 * Inductions
 */

app.get( '/', auth.isMember, function( req, res ) {
	Inductions.find()
		.populate( 'inductors' )
		.sort( { name: 1 } )
		.exec( function( err, inductions ) {
		res.render( 'index', { inductions: inductions } );
	} );
} );

app.get( '/create', auth.isAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );

	res.render( 'create' );
} );

app.post( '/create', auth.isAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'induction-name-required' );
		res.redirect( app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'induction-slug-required' );
		res.redirect( app.mountpath );
		return;
	}

	switch ( req.body.type ) {
		case 'rr':
		case 'fcfs':
			break;
		case '':
		case null:
		case undefined:
		default:
			req.flash( 'danger', 'induction-type-required' );
			res.redirect( app.mountpath );
			return;
	}

	if ( ! req.body.cancellation_window || req.body.cancellation_window.trim() === '' ) {
		req.flash( 'danger', 'induction-cancellation-window-required' );
		res.redirect( app.mountpath );
		return;
	}

	if ( ! req.body.places || req.body.places.trim() === '' ) {
		req.flash( 'danger', 'induction-places-required' );
		res.redirect( app.mountpath );
		return;
	}

	var induction = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		default: {
			type: req.body.type,
			places: req.body.places,
			duration: req.body.duration,
			booking_window: req.body.booking_window,
			cancellation_window: req.body.cancellation_window
		}
	};

	new Inductions( induction ).save( function( err, induction ) {
		req.flash( 'success', 'induction-created' );
		res.redirect( app.mountpath );
	} );
} );

app.get( '/:slug', auth.isMember, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug }, function( err, induction ) {
		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath);
			return;
		}

		res.locals.breadcrumb.push( {
			name: induction.name
		} );

		res.render( 'single', { induction: induction } );
	} );
} );

app.get( '/:slug/edit', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug }).exec ( function( err, induction ) {
		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: induction.name,
			url: app.mountpath + '/' + induction.slug
		} );

		res.locals.breadcrumb.push( {
			name: 'Edit Details',
		} );

		res.render( 'edit', { induction: induction } );
	} );
} );

app.post( '/:slug/edit', auth.isAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', 'induction-name-required' );
		res.redirect( app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', 'induction-slug-required' );
		res.redirect( app.mountpath );
		return;
	}

	switch ( req.body.type ) {
		case 'rr':
		case 'fcfs':
			break;
		case '':
		case null:
		case undefined:
		default:
			req.flash( 'danger', 'induction-type-required' );
			res.redirect( app.mountpath );
			return;
	}

	if ( ! req.body.cancellation_window || req.body.cancellation_window.trim() === '' ) {
		req.flash( 'danger', 'induction-cancellation-window-required' );
		res.redirect( app.mountpath );
		return;
	}

	if ( ! req.body.places || req.body.places.trim() === '' ) {
		req.flash( 'danger', 'induction-places-required' );
		res.redirect( app.mountpath );
		return;
	}

	var induction = {
		name: req.body.name,
		slug: req.body.slug,
		description: req.body.description,
		default: {
			type: req.body.type,
			places: req.body.places,
			duration: req.body.duration,
			booking_window: req.body.booking_window,
			cancellation_window: req.body.cancellation_window
		}
	};

	Inductions.update( { slug: req.params.slug }, induction, function( err ) {
		req.flash( 'success', 'induction-updated' );
		res.redirect( app.mountpath );
	} );
} );

/*
 * Inductors
 */

app.get( '/:slug/inductors', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug })
		.populate( 'inductors' )
		.exec ( function( err, induction ) {

		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: induction.name,
			url: app.mountpath + '/' + induction.slug
		} );

		res.locals.breadcrumb.push( {
			name: 'Inductors',
		} );

		Members.find().sort( { firstname: 1, lastname: 1 } ).exec( function( err, members ) {
			res.render( 'inductors', { induction: induction, members: members } );
		} );
	} );
} );

app.post( '/:slug/inductors/add', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug }, function( err, induction ) {
		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		Members.findOne( { uuid: req.body.member }, function( err, member ) {
			if ( ! member ) {
				req.flash( 'warning', 'member-404' );
				res.redirect( app.mountpath );
				return;
			}

			for ( var i in induction.inductors ) {
				var inductor = induction.inductors[i];
				if ( inductor.toString() == member._id.toString() ) {
					req.flash( 'warning', 'induction-inductor-dupe' );
					res.redirect( app.mountpath + '/' + induction.slug + '/inductors' );
					return;
				}
			}

			Inductions.update( { _id: induction._id }, { $push:  { 'inductors': member._id } }, function( a, b, c ) {
				req.flash( 'success', 'induction-inductor-added' );
				res.redirect( app.mountpath + '/' + induction.slug + '/inductors' );
			} )
		} )
	} );
} );

app.post( '/:slug/inductors/remove/:uuid', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug }, function( err, induction ) {
		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
			if ( ! member ) {
				req.flash( 'warning', 'member-404' );
				res.redirect( app.mountpath );
				return;
			}

			induction.inductors.remove( member._id );
			induction.save( function() {
				req.flash( 'success', 'induction-inductor-removed' );
				res.redirect( app.mountpath + '/' + induction.slug + '/inductors' );
			} );
		} );
	} );
} );

/*
 * Dates
 */

app.get( '/:slug/dates', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug })
		.populate( 'inductors' )
		.exec ( function( err, induction ) {

		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: induction.name,
			url: app.mountpath + '/' + induction.slug
		} );

		res.locals.breadcrumb.push( {
			name: 'Dates',
		} );

		res.render( 'dates', { induction: induction } );
	} );
} );

app.post( '/:slug/dates/add', auth.isAdmin, function( req, res ) {
	Inductions.findOne( { slug: req.params.slug }, function( err, induction ) {
		if ( ! induction ) {
			req.flash( 'warning', 'induction-404' );
			res.redirect( app.mountpath );
			return;
		}

		induction.dates.push( {
			when: moment( req.body.when ).toDate(),
			duration: parseInt( req.body.duration ),
			type: req.body.type,
			places: parseInt( req.body.places ),
			booking_window: parseInt( req.body.booking_window ),
			cancellation_window: parseInt( req.body.cancellation_window ),
			bookings: []
		} );

		console.log( induction.dates );

		// induction.save( function( a, b, c ) {
		// 	console.log( a );
			req.flash( 'success', 'induction-date-added' );
			res.redirect( app.mountpath + '/' + induction.slug + '/dates' );
		// } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
