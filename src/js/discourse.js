"use strict";

var config = require( '../../config/config.json' );

var Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

var request = require( 'request' );

var Discourse = {
	searchUsers: function ( search, callback ) {
		request.get( config.discourse.url + '/admin/users/list/active.json', {
			form: {
				api_username: config.discourse.api_username,
				api_key: config.discourse.api_key,
				show_emails: true,
				filter: search
			}
		}, function ( error, response, body ) {
			if ( response.statusCode == '200 ') {
				var output = JSON.parse( body );
				if ( output[0] != undefined ) {
					return callback( output );
				}
			}
			return callback();
		} );
	},
	getUserByEmail: function ( email, callback ) {
			request.get( config.discourse.url + '/admin/users/list/active.json', {
				form: {
					api_username: config.discourse.api_username,
					api_key: config.discourse.api_key,
					show_emails: true,
					filter: email
				}
			}, function ( error, response, body ) {
				if ( response.statusCode == '200 ') {
					var output = JSON.parse( body );
					if ( output[0] != undefined ) {
						return callback( output[0] );
					}
				}
				return callback();
			} );
		},
	sendPrivateMessage:	function ( username, subject, message ) {
		request.post( config.discourse.url + '/posts', {
			form: {
				api_username: config.discourse.api_username,
				api_key: config.discourse.api_key,
				raw: message,
				title: subject,
				category: "",
				is_warning: "false",
				archetype: "private_message",
				target_usernames: username,
				nested_post: "true"
			}
		} );
	},
	sendActivationMessage: function ( username, code ) {
		var message = "Your activation code: **" + code + "**\n\n[Click here to activate](" + config.audience + '/profile/discourse?code=' + code + ")";
		Discourse.sendPrivateMessage( username, "Activation Code", message );
	},
	addMemberToGroup: function ( member, group ) {
		Discourse.getUserByEmail( member.discourse.email, function( user ) {
			request.put( config.discourse.url + '/groups/' + group.id + '/members.json', {
				form: {
					api_username: config.discourse.api_username,
					api_key: config.discourse.api_key,
					usernames: user.username
				}
			} );
		} );
	},
	removeUserFromGroup: function( discourse_user_id, group ) {
		console.log( 'Removing user "' + discourse_user_id + '" from Group "' + group.name + '".' );
		request.del( config.discourse.url + '/groups/' + group.id + '/members.json', {
			form: {
				api_username: config.discourse.api_username,
				api_key: config.discourse.api_key,
				user_id: discourse_user_id
			}
		} );
	},
	checkDiscourseUser: function( discourse_user_id, permission ) {
		Members.findOne( { 'discourse.id': discourse_user_id } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == null ) return Discourse.removeUserFromGroup( discourse_user_id, permission.group );
			for ( var p = 0; p < member.permissions.length; p++ ) {
				var perm = member.permissions[p];
				if ( perm.permission.slug == permission.slug ) {
					if ( perm.date_added < new Date() ) {
						if ( perm.date_expires == undefined || perm.date_expires > new Date() ) {
							return;
						}
					}
				} else {
					continue;
				}
				Discourse.removeUserFromGroup( discourse_user_id, permission.group );
			}
		} );
	},
	grantMember: function( search ) {
		Members.findOne( search ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == null ) return;
			for ( var p = 0; p < member.permissions.length; p++ ) {
				var perm = member.permissions[p];
				if ( perm.permission.group.id != '' && perm.permission.group.name != '' ) {
					if ( perm.date_added < new Date() ) {
						if ( perm.date_expires == undefined || perm.date_expires > new Date() ) {
							console.log( 'Adding "' + member._id + '" to discourse group "' + perm.permission.group.name + '"' );
							Discourse.addMemberToGroup( member, perm.permission.group );
						}
					}
				}
			}
		} );
	},
	checkPermission: function( permission ) {
		console.log( 'Checking Discourse Group "' + permission.group.name + '"...' );
		request.get( config.discourse.url + '/groups/' + permission.group.name + '/members.json?limit=9999', {
			form: {
				api_username: config.discourse.api_username,
				api_key: config.discourse.api_key
			}
		}, function( err, req, body ) {
			var users = JSON.parse( body ).members;
			if ( users.length > 0 ) {
				for ( var u in users ) {
					Discourse.checkDiscourseUser( users[u].id, permission );
				}
			}
		} );
	},
	checkGroups: function() {
		Permissions.find( {
			'group.id': { $ne: '' },
			'group.name': { $ne: '' }
		}, function( err, permissions ) {
			for ( var p = 0; p < permissions.length; p++ ) {
				Discourse.checkPermission( permissions[p] );
			}
		} );
	}
};

setTimeout( Discourse.checkGroups, 1000 ); // Now and...
setInterval( Discourse.checkGroups, 3600000*24 ); // ...every day

module.exports = Discourse;
