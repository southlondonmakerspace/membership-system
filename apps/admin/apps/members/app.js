"use strict";

var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	discourse = require( __js + '/discourse' ),
	formBodyParser = require( 'body-parser' ).urlencoded( { extended: true } );

var	Permissions = require( __js + '/database' ).Permissions,
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
	res.locals.activeApp = app_config.uid;
	next();
} );

// Members
//////////

app.get( '/', auth.isAdmin, function( req, res ) {
	Members.find( function( err, members ) {
		res.render( 'members', { members: members } );
	} );
} );

// Create Member
////////////////

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.render( 'create', { member: req.session.create } );
	delete req.session.create;
} );

app.post( '/create', [ auth.isSuperAdmin, formBodyParser ], function( req, res ) {
	auth.generateActivationCode( function( generated_password ) {
		auth.generatePassword( generated_password, function( password ) {
			var member = {
				email: req.body.email,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				address: req.body.address,
				password: password,
				activated: true,
				gocardless: {
					mandate_id: req.body.gocardless_mandate_id,
					subscription_id: req.body.gocardless_subscription_id,
					amount: req.body.gocardless_amount
				}
			}

			if ( req.body.tag != '' ) {
				member.tag = {
					id: req.body.tag,
					hashed: auth.hashCard( req.body.tag )
				};
			}

			if ( req.body.discourse_id != '' && req.body.discourse_email != '' ) {
				member.discourse = {
					id: req.body.discourse_id,
					email: req.body.discourse_email,
					activated: true
				};
			}

			new Members( member ).save( function( status ) {
				if ( status != null && status.errors != undefined ) {
					var keys = Object.keys( status.errors );
					for ( var k in keys ) {
						var key = keys[k];
						req.flash( 'danger', status.errors[key].message );
					}
					req.session.create = member;
					res.redirect( app.parent.mountpath + app.mountpath + '/create' );
				} else if ( status != null && status.code == 11000 ) {
					req.session.create = member;
					req.flash( 'danger', messages['discouse-id-duplicate'] );
					res.redirect( app.parent.mountpath + app.mountpath + '/create' );
				} else {
					req.flash( 'success', messages['member-created'] );
					res.redirect( app.parent.mountpath + app.mountpath + '/create' );
				}
			} );
		} );
	} );
} );

// Member
/////////

app.get( '/:uuid', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname
		} );
		res.render( 'member', { member: member, audience: config.audience, superadmin: ( config.superadmins.indexOf( member.email ) != -1 ? true : false ) } );
	} );
} );

// Update Member
////////////////

app.get( '/:uuid/update', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', members['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Update',
		} );
		res.render( 'member-update', { member: member } );
	} );
} );

app.post( '/:uuid/update', [ auth.isSuperAdmin, formBodyParser ], function( req, res ) {
	var member = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		address: req.body.address
	};

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', messages['profile-updated'] );
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Activation
////////////////////

app.get( '/:uuid/activation', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Activation',
		} );
		res.render( 'member-activation', { member: member } );
	} );
} );

app.post( '/:uuid/activation', [ auth.isSuperAdmin, formBodyParser ], function( req, res ) {
	var member = {
		activated: ( req.body.activated ? true : false )
	};

	if ( req.body.activated ) {
		member.activation_code = null;
	}

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', messages['activation-updated'] );
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Tag
/////////////

app.get( '/:uuid/tag', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Tag'
		} );
		res.render( 'member-tag', { member: member } );
	} );
} );

app.post( '/:uuid/tag', [ auth.isAdmin, formBodyParser ], function( req, res ) {
	var hashed_tag = auth.hashCard( req.body.tag );
	var profile = {
		'tag.id': req.body.tag,
		'tag.hashed': hashed_tag
	};

	if ( req.body.tag == '' )
		profile['tag.hashed'] = '';

	Members.update( { uuid: req.params.uuid }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status != null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', messages['tag-updated'] );
		}
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Discourse
///////////////////

app.get( '/:uuid/discourse', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Discourse'
		} );
		res.render( 'member-discourse', { member: member } );
	} );
} );

app.post( '/:uuid/discourse', [ auth.isSuperAdmin, formBodyParser ], function( req, res ) {
	var member = {
		'discourse.mandate_id': req.body.mandate_id,
		'discourse.subscription_id': req.body.subscription_id,
		'discourse.email': req.body.email,
		'discourse.activated': ( req.body.activated ? true : false )
	}

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['discourse-updated'] );
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member GoCardless
////////////////////

app.get( '/:uuid/gocardless', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'GoCardless'
		} );
		res.render( 'member-gocardless', { member: member, minimum: config.gocardless.minimum } );
	} );
} );

app.post( '/:uuid/gocardless', [ auth.isSuperAdmin, formBodyParser ], function( req, res ) {
	var member = {
		'gocardless.mandate_id': req.body.mandate_id,
		'gocardless.subscription_id': req.body.subscription_id,
		'gocardless.amount': req.body.amount,
		'gocardless.minimum': req.body.minimum
	}

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['gocardless-updated'] );
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Permissions
/////////////////////

app.get( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', messages['member-404'] );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member.uuid
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions'
			} );
			res.render( 'member-permissions', { permissions: permissions, member: member, now: new Date() } );
		} );
	} );
} );

// Grant Member Permission
//////////////////////////

app.post( '/:uuid/permissions', [ auth.isAdmin, formBodyParser ], function( req, res ) {
	Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
		if ( permission != undefined ) {
			if ( permission.superadmin_only && res.locals.access != 'superadmin' ) {
				req.flash( 'danger', messages['permission-sa-only'] );
				res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			var new_permission = {
				permission: permission.id
			}

			new_permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );

			if ( req.body.expiry_date != '' && req.body.expiry_time != '' )
				new_permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

			if ( new_permission.date_added >= new_permission.date_expires ) {
				req.flash( 'warning', messages['permission-expiry-error'] );
				res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			Members.update( { uuid: req.params.uuid }, {
				$push: {
					permissions: new_permission
				}
			}, function ( status ) {
				discourse.grantMember( { uuid: req.params.uuid } );
			} );
		} else {
			req.flash( 'warning', messages['permission-404'] );
		}
		res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
	} );
} );

// Modify Member Permission
///////////////////////////

app.get( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', messages['member-404'] );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			if ( member.permissions.id( req.params.id ) == undefined ) {
				req.flash( 'warning', messages['permission-404'] );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
				req.flash( 'danger', messages['permission-sa-only'] );
				res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member.uuid
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions',
				url: '/admin/members/' + member.uuid + '/permissions'
			} );
			res.locals.breadcrumb.push( {
				name: member.permissions.id( req.params.id ).permission.name
			} );
			res.render( 'member-permission', { permissions: permissions, member: member, current: member.permissions.id( req.params.id ) } );
		} );
	} );
} );

app.post( '/:uuid/permissions/:id/modify', [ auth.isAdmin, formBodyParser ], function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ) == undefined ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
			req.flash( 'danger', messages['permission-sa-only'] );
			res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		Permissions.findOne( { slug: req.body.permission }, function( err, newPermission ) {
			if ( newPermission == undefined ) {
				req.flash( 'warning', messages['permission-404'] );
				res.redirect( app.parent.mountpath + app.mountpath );
				return;
			}

			if ( newPermission.superadmin_only && res.locals.access != 'superadmin' ) {
				req.flash( 'danger', messages['permission-sa-only'] );
				res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			var permission = member.permissions.id( req.params.id );
			permission.permission = newPermission._id;

			if ( req.body.start_date != '' && req.body.start_time != '' ) {
				permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );
			} else {
				permission.date_added = new Date();
			}

			if ( req.body.expiry_date != '' && req.body.expiry_time != '' ) {
				permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

				if ( permission.date_added >= permission.date_expires ) {
					req.flash( 'warning', messages['permission-expiry-error'] );
					res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
					return;
				}
			} else {
				permission.date_expires = null;
			}

			member.save( function ( err ) {
				req.flash( 'success', messages['permission-updated'] );
				res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
				discourse.checkGroups();
				discourse.grantMember( { uuid: req.params.uuid } );
			} );
		} );
	} );
} );

// Revoke Member Permission
///////////////////////////

app.get( '/:uuid/permissions/:id/revoke', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ) == undefined ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		console.log( member.permissions.id( req.params.id ).permission );

		if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
			req.flash( 'danger', messages['permission-sa-only'] );
			res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		member.permissions.pull( { _id: req.params.id } );

		member.save( function ( err ) {
			req.flash( 'success', messages['permission-removed'] );
			res.redirect( app.parent.mountpath + app.mountpath + '/' + req.params.uuid + '/permissions' );
			discourse.checkGroups();
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
