var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express(),
	discourse = require( __js + '/discourse' );

var Options = require( __js + '/options.js' )();

var PostcodesIO = require( 'postcodesio-client' ),
	postcodes = new PostcodesIO();

var escapeStringRegexp = require( 'escape-string-regexp' );

var moment = require( 'moment' );
var	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	Payments = db.Payments,
	Events = db.Events;

var Mail = require( __js + '/mail' );

var auth = require( __js + '/authentication' );

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
		if ( ! ( auth.canSuperAdmin( req ) == true && req.query.show_inactive_members ) ) {
			var member = permissions.filter( function( permission ) {
				if ( permission.slug == config.permission.member ) return true;
				return false;
			} )[0];
			filter_permissions.push( member );
			permissions = permissions.filter( function( p ) {
				if ( p.slug == config.permission.member ) return false;
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

		var path = {};

		// Add permission list to search parameters
		var search = { $and: [] };
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
			if ( filter != [] ) search['$and'] = filter;
			path['permission'] = 'permission=' + req.query.permission;
		}

		if ( req.query.firstname ) {
			search['$and'].push( { firstname: new RegExp( '.*' + escapeStringRegexp( req.query.firstname ) + '.*', 'i' ) } );
			path['firstname'] = 'firstname=' + req.query.firstname;
		}
		if ( req.query.lastname ) {
			search['$and'].push( { lastname: new RegExp( '.*' + escapeStringRegexp( req.query.lastname ) + '.*', 'i' ) } );
			path['lastname'] = 'lastname=' + req.query.lastname;
		}
		if ( req.query.email && auth.canSuperAdmin( req ) == true ) {
			search['$and'].push( { email: new RegExp( '.*' + escapeStringRegexp( req.query.email ) + '.*', 'i' ) } );
			path['email'] = 'email=' + req.query.email;
		}
		if ( req.query.discourse ) {
			search['$and'].push( { 'discourse.username': new RegExp( '.*' + escapeStringRegexp( req.query.discourse ) + '.*', 'i' ) } );
			path['discourse'] = 'discourse=' + req.query.discourse;
		}
		if ( search['$and'].length == 0 ) search = {};

		// Process pagination
		var limit = 10;
		if ( req.query.limit && req.query.limit > 0 && req.query.limit <= 1000 )
			limit = parseInt( req.query.limit );

		var page = 1;
		if ( req.query.page && req.query.page > 0 )
			page = parseInt( req.query.page );

		// Perform search
		Members.count( search, function( err, total ) {
			if ( req.query.show_inactive_members ) path.show_inactive_members = 'show_inactive_members=true';
			if ( req.query.limit && req.query.limit > 0 && req.query.limit <= 1000 ) path.limit = 'limit=' + limit;
			if ( req.query.page && req.query.page > 0 ) path.page = 'page=' + page;

			// Pages
			var append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key != 'page' ) append_path.push( path[key] );
			} );
			append_path = append_path.join( '&' );
			form_path = append_path;

			var pages = [];
			for ( var p = 1; p <= Math.ceil( total / limit ); p++ ) {
				var item = {
					number: p,
					path: '?page=' + p + ( append_path ? '&' + append_path : '' )
				}
				pages.push( item );
			}
			var next = ( page + 1 ) <= pages.length ? pages[ page ] : null;
			var prev = ( page - 1 ) > 0 ? pages[ page - 2 ] : null;
			var pagination = {
				pages: pages,
				limit: limit,
				page: page,
				prev: prev,
				next: next,
				total: pages.length
			};

			// Limit
			append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key == 'limit' ) return;
				if ( key == 'page' ) return;
				append_path.push( path[key] );
			} );
			append_path = append_path.join( '&' );

			var limits = [ 10, 25, 50, 100, 250, 500, 1000 ];
			limits.forEach( function( limit, l ) {
				limits[l] = {
					number: limit,
					path: '?limit=' + limit + ( append_path ? '&' + append_path : '' )
				}
			} );

			// Inactive members
			append_path = [];
			Object.keys( path ).forEach( function( key ) {
				if ( key == 'show_inactive_members' ) return;
				if ( key == 'page' ) return;
				append_path.push( path[key] );
			} );
			inactive_members_path = append_path.join( '&' );

			// Search data
			var search_data = {
				firstname: req.query.firstname,
				lastname: req.query.lastname,
				email: req.query.email,
				discourse: req.query.discourse,
				show_inactive_members: req.query.show_inactive_members,
				permission: req.query.permission
			}

			Members.find( search ).limit( limit ).skip( limit * ( page - 1 ) ).sort( [ [ 'lastname', 1 ], [ 'firstname', 1 ] ] ).exec( function( err, members ) {
				res.render( 'index', {
					members: members,
					permissions: permissions,
					pagination: pagination,
					limits: limits,
					count: members ? members.length : 0,
					total: total,
					search: search_data
				} );
			} );
		} );
	} );
} );

app.get( '/:uuid', auth.isMember, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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
			req.flash( 'warning', 'member-404' );
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
 			req.flash( 'danger', 'information-ommited' );
 			res.redirect( app.mountpath + '/' + req.params.uuid + '/profile' );
 			return;
	}

	var postcode = '';
	var results = req.body.address.match( /([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)/ );

	if ( results ) {
		postcode = results[0];
	}
	postcodes.lookup( postcode ).then( function( data ) {
		var member = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email.toLowerCase(),
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
			req.flash( 'success', 'profile-updated' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/profile' );
		} );
	}, function( error ) {
		req.log.debug( {
			app: 'members',
			action: 'error-lookingup-postcode',
			error: error
		} );

		var member = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email.toLowerCase(),
			address: req.body.address
		};

		Members.update( { uuid: req.params.uuid }, member, function( status ) {
			req.flash( 'success', 'profile-updated' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/profile' );
		} );
	} );
} );

app.get( '/:uuid/activation', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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
		req.flash( 'success', 'activation-updated' );
		res.redirect( app.mountpath + '/' + req.params.uuid + '/activation' );
	} );
} );

app.get( '/:uuid/tag', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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

	Members.findOne( { 'tag.id': req.body.tag }, function( err, member ) {
		if ( member ) {
			if ( member.uuid === req.params.uuid ) {
				req.flash( 'info', 'tag-unchanged' );
			} else {
				req.flash( 'danger', 'tag-invalid-not-unique' );
			}
			res.redirect( app.mountpath + '/' + req.params.uuid + '/tag' );
			return;
		}

		if ( req.body.tag ) {
			var validateTag = auth.validateTag( req.body.tag );
			if ( validateTag ) {
				req.flash( 'danger', validateTag );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/tag' );
				return;
			}

			var hashed_tag = auth.hashTag( req.body.tag );
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
				req.flash( 'success', 'tag-updated' );
			}
			res.redirect( app.mountpath + '/' + req.params.uuid );
		} );
	} );
} );

app.get( '/:uuid/discourse', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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

	if ( req.body.activated ) member['discourse.activation_code'] = null;

	Members.findOne( { "discourse.username": req.body.username }, function( err, member ) {
		if ( member ) {
			req.flash( 'warning', 'discouse-username-duplicate' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/discourse' );
		} else {
			Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
				req.flash( 'success', 'discourse-updated' );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/discourse' );
			} );
		}
	} );
} );

app.get( '/:uuid/gocardless', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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
		res.render( 'gocardless', { member: member } );
	} );
} );

app.post( '/:uuid/gocardless', auth.isSuperAdmin, function( req, res ) {
	var member = {
		'gocardless.mandate_id': req.body.mandate_id,
		'gocardless.subscription_id': req.body.subscription_id,
		'gocardless.minimum': req.body.minimum
	};

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', 'gocardless-updated' );
		res.redirect( app.mountpath + '/' + req.params.uuid + '/gocardless' );
	} );
} );

app.get( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( ! member ) {
				req.flash( 'warning', 'member-404' );
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
			res.render( 'permissions', {
				permissions: permissions,
				member: member
			} );
		} );
	} );
} );

app.post( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	if ( ! req.body.permission ||
		 ! req.body.start_time ||
 		 ! req.body.start_date ) {
		req.flash( 'danger', 'information-ommited' );
		res.redirect( app.mountpath );
		return;
	}

	Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
		if ( permission ) {

			if ( ! res.locals.can_admin( permission.slug ) && ! res.locals.access( 'superadmin' ) ) {
				req.flash( 'danger', messages[ 'permission-admin-only' ] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			var new_permission = {
				permission: permission.id
			};

			if ( res.locals.access( 'superadmin' ) ) {
				new_permission.admin = req.body.admin ? true : false;
			}

			new_permission.date_added = moment( req.body.start_date + 'T' + req.body.start_time ).toDate();

			if ( req.body.expiry_date !== '' && req.body.expiry_time !== '' )
				new_permission.date_expires = moment( req.body.expiry_date + 'T' + req.body.expiry_time ).toDate();

			if ( new_permission.date_added >= new_permission.date_expires ) {
				req.flash( 'warning', 'permission-expiry-error' );
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
					req.flash( 'danger', 'permission-duplicate' );
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
			req.flash( 'warning', 'permission-404' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		}
	} );
} );

app.get( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', 'permission-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! res.locals.can_admin( member.permissions.id( req.params.id ).permission.slug ) && ! res.locals.access( 'superadmin' ) ) {
			req.flash( 'danger', messages[ 'permission-admin-only' ] );
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
		res.render( 'permission', {
			member: member,
			current: member.permissions.id( req.params.id )
		} );
	} );
} );

app.post( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	if ( ! req.body.start_time ||
 		 ! req.body.start_date ) {
		req.flash( 'danger', 'information-ommited' );
		res.redirect( app.mountpath );
		return;
	}

	Members.findOne( { uuid: req.params.uuid }).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', 'permission-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! res.locals.can_admin( member.permissions.id( req.params.id ).permission.slug ) && ! res.locals.access( 'superadmin' ) ) {
			req.flash( 'danger', messages[ 'permission-admin-only' ] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		var permission = member.permissions.id( req.params.id );

		if ( res.locals.access( 'superadmin' ) ) {
			permission.admin = req.body.admin ? true : false;
		}

		if ( req.body.start_date !== '' && req.body.start_time !== '' ) {
			permission.date_added = moment( req.body.start_date + 'T' + req.body.start_time ).toDate();
		} else {
			permission.date_added = new Date();
		}

		if ( req.body.expiry_date !== '' && req.body.expiry_time !== '' ) {
			permission.date_expires = moment( req.body.expiry_date + 'T' + req.body.expiry_time ).toDate();

			if ( permission.date_added >= permission.date_expires ) {
				req.flash( 'warning', 'permission-expiry-error' );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}
		} else {
			permission.date_expires = null;
		}

		member.save( function ( err ) {
			req.flash( 'success', 'permission-updated' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		} );
	} );
} );

app.post( '/:uuid/permissions/:id/revoke', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! member.permissions.id( req.params.id ) ) {
			req.flash( 'warning', 'permission-404' );
			res.redirect( app.mountpath );
			return;
		}

		if ( ! res.locals.can_admin( member.permissions.id( req.params.id ).permission.slug ) && ! res.locals.access( 'superadmin' ) ) {
			req.flash( 'danger', messages[ 'permission-admin-only' ] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			return;
		}

		member.permissions.pull( { _id: req.params.id } );

		member.save( function ( err ) {
			req.flash( 'success', 'permission-removed' );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		} );
	} );
} );

app.get( '/:uuid/2fa', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
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
					req.flash( 'success', '2fa-disabled' );
					res.redirect( app.mountpath + '/' + req.params.uuid );
			} );
		} );
	} else {
		req.flash( 'success', '2fa-no-change' );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	}
} );



app.get( '/:uuid/override', auth.isSuperAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( ! member ) {
			req.flash( 'warning', 'member-404' );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Signup Override',
		} );
		res.render( 'override', { member: member } );
	} );
} );

app.post( '/:uuid/override', auth.isSuperAdmin, function( req, res ) {
	var member = {
		signup_override: ( req.body.override ? true : false )
	};

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', 'override-updated' );
		res.redirect( app.mountpath + '/' + req.params.uuid + '/override' );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
