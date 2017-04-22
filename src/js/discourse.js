var config = require( '../../config/config.json' );

var Database = require( '../../src/js/database' ),
	Permissions = Database.Permissions,
	Members = Database.Members,
	ObjectId = Database.ObjectId;

var request = require( 'request' );

var api_tasks = [];

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
			console.log( body );
			if ( response.statusCode == '200 ') {
				var output = JSON.parse( body );
				if ( output[0] !== undefined ) {
					return callback( output );
				}
			}
			return callback();
		} );
	},
	getUsername: function( username, callback ) {
		request.get( config.discourse.url + '/users/' + username + '.json', {
			form: {
				api_username: config.discourse.api_username,
				api_key: config.discourse.api_key
			}
		}, function ( error, response, body ) {
			if ( response !== undefined && response.statusCode == '200' ) {
				var output = JSON.parse( body );
				return callback( output );
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
	checkGroups: function() {
		api_tasks.push( function() {
			console.log( 'Check all discourse groups' );
			Permissions.find( {
				'group.id': { $ne: '' },
				'group.name': { $ne: '' }
			}, function( err, permissions ) {
				for ( var p = 0; p < permissions.length; p++ ) {
					Discourse.checkPermission( permissions[p] );
				}
			} );
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
			if ( body === undefined )
				return;
			var users = JSON.parse( body ).members;
			var usernames = [];
			// Check for users to remove
			if ( users.length > 0 ) {
				// Loop through discourse users
				for ( var u in users ) {
					var user = users[u];
					usernames.push( user.username );
					Discourse.checkDiscourseUser( user.username, permission );
				}
			}
			// Check for users to add
			Permissions.findOne( { slug: 'member' }, function( err, membership_permission ) {
				Members.find( {
					'discourse.activated': true,
					$and: [
						{
							permissions: {
								$elemMatch: {
									permission: membership_permission._id,
									date_added: { $lte: new Date() },
									$or: [
										{ date_expires: null },
										{ date_expires: { $gt: new Date() } }
									]
								}
							}
						},
						{
							permissions: {
								$elemMatch: {
									permission: permission._id,
									date_added: { $lte: new Date() },
									$or: [
										{ date_expires: null },
										{ date_expires: { $gt: new Date() } }
									]
								}
							}
						}
					]
				} , function( err, members ) {
					for ( var i = 0; i < members.length; i++ ) {
						var member = members[i];
						if ( usernames.indexOf( member.discourse.username ) == -1 ) {
							Discourse.addUser( member.discourse.username, permission );
						}
					}
				} );
			} );
		} );
	},
	checkDiscourseUser: function( username, permission ) {
		Permissions.findOne( { slug: 'member' }, function( err, membership_permission ) {
			Members.findOne( {
				'discourse.username': username,
				$and: [
					{
						permissions: {
							$elemMatch: {
								permission: membership_permission._id,
								date_added: { $lte: new Date() },
								$or: [
									{ date_expires: null },
									{ date_expires: { $gt: new Date() } }
								]
							}
						}
					},
					{
						permissions: {
							$elemMatch: {
								permission: permission._id,
								date_added: { $lte: new Date() },
								$or: [
									{ date_expires: null },
									{ date_expires: { $gt: new Date() } }
								]
							}
						}
					}
				]
			} ).populate( 'permissions.permission' ).exec( function( err, member ) {
				if ( member === undefined ) {
					Discourse.removeUser( username, permission );
					return;
				}
			} );
		} );
	},
	checkPrimaryGroups: function() {
		Members.find( {
			'discourse.activated': true,
			permissions: {
				$elemMatch: {
					date_added: { $lte: new Date() },
					$or: [
						{ date_expires: null },
						{ date_expires: { $gt: new Date() } }
					]
				}
			}
		} ).populate( 'permissions.permission' ).exec( function( err, members ) {
			for ( var m = 0; m < members.length; m++ ) {
				var member = members[m];
				member.permissions = member.permissions.filter( function ( perm ) {
					if ( perm.permission.group.order === undefined ) return false;
					return true;
				} ).sort( function ( a, b ) {
					if ( a.permission.group.order > b.permission.group.order ) return 1;
					if ( a.permission.group.order < b.permission.group.order ) return -1;
					return 0;
				} );

				if ( member.permissions.length >= 1 ) {
					Discourse.setPrimaryGroup( member.discourse.username, member.permissions[0].permission );
				}
			}
		} );
	},
	setPrimaryGroup: function( username, permission ) {
		api_tasks.push( function() {
			console.log( 'Setting user "' + username + '" primary group to "' + permission.group.name + '".' );
			Discourse.getUsername( username, function( user ) {
				if ( user !== undefined )
					request.put( config.discourse.url + '/admin/users/' + user.user.id + '/primary_group', {
						form: {
							api_username: config.discourse.api_username,
							api_key: config.discourse.api_key,
							primary_group_id: permission.group.id
						}
					} );
			} );
		} );
	},
	addUser: function( username, permission ) {
		api_tasks.push( function() {
			console.log( 'Adding user "' + username + '" to group "' + permission.group.name + '".' );
			request.put( config.discourse.url + '/groups/' + permission.group.id + '/members.json', {
				form: {
					api_username: config.discourse.api_username,
					api_key: config.discourse.api_key,
					usernames: username
				}
			} );
		} );
	},
	removeUser: function( username, permission ) {
		api_tasks.push( function() {
			console.log( 'Removing user "' + username + '" from group "' + permission.group.name + '".' );
			Discourse.getUsername( username, function( user ) {
				request.del( config.discourse.url + '/groups/' + permission.group.id + '/members.json', {
					form: {
						api_username: config.discourse.api_username,
						api_key: config.discourse.api_key,
						user_id: user.user.id
					}
				} );
			} );
		} );
	}
};

setInterval( function() {
	if ( api_tasks.length > 0 )
		api_tasks.pop()();
}, 250 );

module.exports = Discourse;
