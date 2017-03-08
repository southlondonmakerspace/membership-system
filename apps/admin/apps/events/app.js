"use strict";

var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var Events = require( __js + '/database' ).Events,
	Members = require( __js + '/database' ).Members;

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'admin';
	next();
} );

app.get( '/link/:event', auth.isAdmin, function( req, res ) {
	Events.findById( req.params.event ).populate( 'activity' ).exec( function( err, event ) {
		if ( event != undefined ) {
			if ( event.activity.slug == 'unknown-tag' ) {
				Members.find( function( err, members ) {
					res.render( 'link', { members: members, event: event, tag: event.action } );
				} );
			} else {
				req.flash( 'danger', messages['event-not-linkable'] )
				res.redirect( '/events' );
			}
		} else {
			req.flash( 'danger', messages['event-404'] )
			res.redirect( '/events' );
		}
	} );
} );

app.get( '/link/:event/:member', auth.isAdmin, function( req, res ) {
	Events.findById( req.params.event ).populate( 'activity' ).exec( function( err, event ) {
		if ( event != undefined ) {
			if ( event.activity.slug == 'unknown-tag' ) {
				Members.findOne( { uuid: req.params.member }, function( err, member ) {
					if ( member != undefined ) {
						var hashed_tag = auth.hashCard( event.action );
						member.tag.id = event.action;
						member.tag.hashed = hashed_tag;
						member.save( function ( err ) {} );
					} else {
						req.flash( 'danger', messages['member-404'] )
						res.redirect( '/events' );
					}
				} );
			} else {
				req.flash( 'danger', messages['event-not-linkable'] )
				res.redirect( '/events' );
			}
		} else {
			req.flash( 'danger', messages['event-404'] )
			res.redirect( '/events' );
		}
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
