var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	discourse = require( __js + '/discourse' );

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var moment = require( 'moment' );
var	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	Payments = db.Payments,
	Events = db.Events;

var Mail = require( __js + '/mail' );

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'members';
	next();
} );

app.get( '/', auth.isMember, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		var filter_permissions = [];

		// If not admin or requesting active members only add member permission to filtering list
		if ( ! ( auth.canSuperAdmin( req ) == true && req.query.inactive_members !== undefined ) ) {
			var member = permissions.filter( function( permission ) {
				if ( permission.slug == 'member' ) return true;
				return false;
			} )[0];
			filter_permissions.push( member );
			permissions = permissions.filter( function( p ) {
				if ( p.slug == 'member' ) return false;
				return true;
			} );
		}

		// If requested add custom permission to filtering list
		var permission;
		if ( req.query.permission ) {
			permission = permissions.filter( function( permission ) {
				if ( permission.slug == req.query.permission ) return true;
				return false;
			} );
			if ( permission.length !== 1 ) {
				permission = null;
			} else if ( permission.length === 1 ) {
				permission = permission[0];
				filter_permissions.push( permission );
				res.locals.breadcrumb.push( {
					name: permission.name,
				} );
			}
		}

		// Add permission list to search parameters
		var search = {};
		if ( filter_permissions.length > 0 ) {
			var filter = [];
			for ( var fp in filter_permissions ) {
				filter.push( {
					permissions: {
						$elemMatch: {
							permission: filter_permissions[fp]._id,
							date_added: { $lte: new Date() },
							$or: [
								{ date_expires: null },
								{ date_expires: { $gt: new Date() } }
							]
						}
					}
				} );
			}
			search = { $and: filter };
		}

		// Perform search
		Members.find( search ).sort( [ [ 'lastname', 1 ], [ 'firstname', 1 ] ] ).exec( function( err, members ) {
			res.render( 'index', {
				members: members,
				permissions: permissions,
				filter_permission: ( permission !== null ? permission : null ),
				inactive_members: ( req.query.inactive_members !== undefined ? false : true )
			} );
		} );
	} );
} );

app.get( '/:uuid', auth.isMember, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		Payments.find( { member: member._id }, function( err, payments ) {
			res.locals.breadcrumb.push( {
				name: member.fullname
			} );
			discourse.getUsername( member.discourse.username, function( discourse ) {
				var total = 0;

				for ( p in payments ) {
					total += payments[p].amount;
				}

				res.render( 'member', {
					member: member,
					payments: payments,
					discourse: discourse,
					discourse_path: config.discourse.url,
					audience: config.audience,
					superadmin: ( config.superadmins.indexOf( member.email ) != -1 ? true : false ),
					password_tries: config['password-tries'],
					total: total
				} );
			} );
		} );
	} );
} );

app.get( '/:uuid/profile', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Profile',
		} );
		res.render( 'update', { member: member } );
	} );
} );

app.post( '/:uuid/profile', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.firstname ||
		 ! req.body.lastname ||
		 ! req.body.email ||
		 ! req.body.address ) {
 			req.flash( 'danger', messages['information-ommited'] );
 			res.redirect( app.mountpath + '/' + req.params.uuid + '/update' );
 			return;
	}

	var postcode = '';
	var results = req.body.address.match( /([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)/ );

	if ( results ) {
		postcode = results[0];
	}
	postcodes.lookup( postcode, function( err, data ) {
		var member = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			address: req.body.address
		};

		if ( data ) {
			member.postcode_coordinates = {
				lat: data.latitude,
				lng: data.longitude,
			};
		} else {
			member.postcode_coordinates = null;
		}

		Members.update( { uuid: req.params.uuid }, member, function( status ) {
			req.flash( 'success', messages['profile-updated'] );
			res.redirect( app.mountpath + '/' + req.params.uuid );
		} );
	} );
} );

app.get( '/:uuid/activation', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Activation',
		} );
		res.render( 'activation', { member: member } );
	} );
} );

app.post( '/:uuid/activation', auth.isSuperAdmin, function( req, res ) {
	var member = {
		activated: ( req.body.activated ? true : false )
	};

	if ( req.body.activated ) {
		member.activation_code = null;
	}

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', messages['activation-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

app.get( '/:uuid/tag', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Tag'
		} );
		res.render( 'tag', { member: member } );
	} );
} );

app.post( '/:uuid/tag', auth.isSuperAdmin, function( req, res ) {
	var profile = {};

	if ( req.body.tag ) {
		var hashed_tag = auth.hashCard( req.body.tag );
		profile = {
			'tag.id': req.body.tag,
			'tag.hashed': hashed_tag
		};
	} else {
		profile = {
			'tag.id': '',
			'tag.hashed': ''
		};
	}

	Members.update( { uuid: req.params.uuid }, { $set: profile }, function( status ) {
		if ( status ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', messages['tag-updated'] );
		}
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

app.get( '/:uuid/discourse', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Discourse'
		} );
		res.render( 'discourse', { member: member } );
	} );
} );

app.post( '/:uuid/discourse', auth.isSuperAdmin, function( req, res ) {
	var member = {
		'discourse.username': req.body.username,
		'discourse.activated': ( req.body.activated ? true : false )
	};

	if ( req.body.clear ) member['discourse.activation_code'] = null;

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['discourse-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

app.get( '/:uuid/gocardless', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'GoCardless'
		} );
		res.render( 'gocardless', { member: member, minimum: config.gocardless.minimum } );
	} );
} );

app.post( '/:uuid/gocardless', auth.isSuperAdmin, function( req, res ) {
	var member = {
		'gocardless.mandate_id': req.body.mandate_id,
		'gocardless.subscription_id': req.body.subscription_id,
		'gocardless.minimum': req.body.minimum
	};

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['gocardless-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

app.get( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( ! member ) {
				req.flash( 'warning', messages['member-404'] );
				res.redirect( app.mountpath );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/members/' + member.uuid
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions'
			} );
			res.render( 'permissions', { permissions: permissions, member: member, superadmin: ( config.superadmins.indexOf( member.email ) != -1 ? true : false ) } );
		} );
	} );
} );

app.post( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	if ( ! req.body.permission ||
		 ! req.body.start_time ||
 		 ! req.body.start_date ) {
		req.flash( 'danger', messages['information-ommited'] );
		res.redirect( app.mountpath );
		return;
	}

	Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
		if ( permission ) {
			if ( permission.superadmin_only && res.locals.access != 'superadmin' ) {
				req.flash( 'danger', messages['permission-sa-only'] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			var new_permission = {
				permission: permission.id
			};

			new_permission.date_added = moment( req.body.start_date + 'T' + req.body.start_time ).toDate();

			if ( req.body.expiry_date !== '' && req.body.expiry_time !== '' )
				new_permission.date_expires = moment( req.body.expiry_date + 'T' + req.body.expiry_time ).toDate();

			if ( new_permission.date_added >= new_permission.date_expires ) {
				req.flash( 'warning', messages['permission-expiry-error'] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			Members.findOne( { uuid: req.params.uuid }, function ( err, member ) {
				var dupe = false;
				for ( var p = 0; p < member.permissions.length; p++ ) {
					if ( member.permissions[p].permission.toString() == permission._id.toString() ) {
						dupe = true;
						break;
					}
				}
				if ( dupe ) {
					req.flash( 'danger', messages['permission-duplicate'] );
					res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
					return;
				}

				Members.update( { uuid: req.params.uuid }, {
					$push: {
						permissions: new_permission
					}
				}, function ( status ) {
					res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				} );
			} );
		} else {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		}
	} );
} );

app.get( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
			req.flash( 'danger', messages['permission-sa-only'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Permissions',
			url: '/members/' + member.uuid + '/permissions'
		} );
		res.locals.breadcrumb.push( {
			name: member.permissions.id( req.params.id ).permission.name
		} );
		res.render( 'permission', { member: member, current: member.permissions.id( req.params.id ) } );
	} );
} );

app.post( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	if ( ! req.body.start_time ||
 		 ! req.body.start_date ) {
		req.flash( 'danger', messages['information-ommited'] );
		res.redirect( app.mountpath );
		return;
	}

	Members.findOne( { uuid: req.params.uuid }).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
			req.flash( 'danger', messages['permission-sa-only'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		var permission = member.permissions.id( req.params.id );

		if ( req.body.start_date !== '' && req.body.start_time !== '' ) {
			permission.date_added = moment( req.body.start_date + 'T' + req.body.start_time ).toDate();
		} else {
			permission.date_added = new Date();
		}

		if ( req.body.expiry_date !== '' && req.body.expiry_time !== '' ) {
			permission.date_expires = moment( req.body.expiry_date + 'T' + req.body.expiry_time ).toDate();

			if ( permission.date_added >= permission.date_expires ) {
				req.flash( 'warning', messages['permission-expiry-error'] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}
		} else {
			permission.date_expires = null;
		}

		member.save( function ( err ) {
			req.flash( 'success', messages['permission-updated'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		} );
	} );
} );

app.post( '/:uuid/permissions/:id/revoke', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ).permission.superadmin_only && res.locals.access != 'superadmin' ) {
			req.flash( 'danger', messages['permission-sa-only'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		member.permissions.pull( { _id: req.params.id } );

		member.save( function ( err ) {
			req.flash( 'success', messages['permission-removed'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		} );
	} );
} );

app.get( '/link/:event', auth.isAdmin, function( req, res ) {
	Events.findById( req.params.event ).populate( 'activity' ).exec( function( err, event ) {
		if ( event ) {
			if ( event.activity.slug == 'unknown-tag' ) {
				Members.find( function( err, members ) {
					res.render( 'link', { members: members, event: event, tag: event.action } );
				} );
			} else {
				req.flash( 'danger', messages['event-not-linkable'] );
				res.redirect( '/events' );
			}
		} else {
			req.flash( 'danger', messages['event-404'] );
			res.redirect( '/events' );
		}
	} );
} );

app.get( '/link/:event/:member', auth.isAdmin, function( req, res ) {
	Events.findById( req.params.event ).populate( 'activity' ).exec( function( err, event ) {
		if ( event ) {
			if ( event.action.trim() !== '' ) {
				if ( event.activity.slug == 'unknown-tag' ) {
					Members.findOne( { uuid: req.params.member }, function( err, member ) {
						if ( member ) {
							var hashed_tag = auth.hashCard( event.action );
							member.tag.id = event.action;
							member.tag.hashed = hashed_tag;
							member.save( function ( err ) {} );
							Events.update( { action: event.action }, { $set: { action: 'linked', member: member._id } }, { multi: true }, function( err ) {
								req.flash( 'success', messages['event-linked'] );
								res.redirect( '/events' );
							} );
						} else {
							req.flash( 'danger', messages['member-404'] );
							res.redirect( '/events' );
						}
					} );
				} else {
					req.flash( 'danger', messages['event-not-linkable'] );
					res.redirect( '/events' );
				}
			} else {
				req.flash( 'danger', messages['event-not-linkable'] );
				res.redirect( '/events' );
			}
		} else {
			req.flash( 'danger', messages['event-404'] );
			res.redirect( '/events' );
		}
	} );
} );

app.get( '/:uuid/2fa', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: '2FA'
		} );
		res.render( '2fa', { member: member } );
	} );
} );

app.post( '/:uuid/2fa', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body['2fa-enabled'] ) {
		var member = {
			otp: {
				key: ''
			}
		};
		Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
			var options = {
				firstname: req.user.firstname
			};

			Mail.sendMail(
				req.user.email,
				'Two Factor Authentaction Disabled',
				__dirname + '/email-templates/disabled.text.pug',
				__dirname + '/email-templates/disabled.html.pug',
				options,
				function() {
					req.flash( 'success', messages['2fa-disabled'] );
					res.redirect( app.mountpath + '/' + req.params.uuid );
			} );
		} );
	} else {
		req.flash( 'success', messages['2fa-no-change'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	}
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
