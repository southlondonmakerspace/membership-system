var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config/config.json';

var config = require( __config );

var Database = require( __js + '/database' ),
	Permissions = Database.Permissions,
	Members = Database.Members,
	ObjectId = Database.ObjectId;

var request = require( 'request' ),
	queryString = require( 'query-string' );

var api_tasks = [];

var Discourse = {
	queryString: function( url, params ) {
		return url + '?' + queryString.stringify( params );
	},
	get: function( url, params, cb ) {
		if ( typeof params === 'function' ) cb = params;
		if ( typeof params !== 'object' ) params = {};
		params.api_username = config.discourse.api_username;
		params.api_key = config.discourse.api_key;
		var options = {
			url: Discourse.queryString( config.discourse.url + url, params )
		};
		request( options, cb );
	},
	request: function( action, url, params, cb ) {
		if ( typeof params !== 'object' ) params = {};
		params.api_username = config.discourse.api_username;
		params.api_key = config.discourse.api_key;
		var options = {
			url: config.discourse.url + url,
			method: action,
			form: params
		};
		request( options, cb );
	},
	post: function( url, params, cb ) {
		if ( typeof params === 'function' ) cb = params;
		Discourse.request( 'POST', url, params, cb );
	},
	put: function( url, params, cb ) {
		if ( typeof params === 'function' ) cb = params;
		Discourse.request( 'PUT', url, params, cb );
	},
	del: function( url, params, cb ) {
		if ( typeof params === 'function' ) cb = params;
		Discourse.request( 'DELETE', url, params, cb );
	},
	searchUsers: function ( search, callback ) {
		var params = {
			show_emails: true,
			filter: search
		};
		Discourse.get( '/admin/users/list/active.json', params, function ( error, response, body ) {
			if ( response && response.statusCode == '200' ) {
				var output = JSON.parse( body );
				if ( output[0] ) {
					return callback( output );
				}
			}
			return callback();
		} );
	},
	getUsername: function( username, callback ) {
		Discourse.get( '/users/' + username + '.json', function ( error, response, body ) {
			if ( response && response.statusCode == '200' ) {
				var output = JSON.parse( body );
				return callback( output );
			}
			return callback();
		} );
	},
	sendPrivateMessage:	function ( username, subject, message ) {
		var params = {
			raw: message,
			title: subject,
			category: "",
			is_warning: "false",
			archetype: "private_message",
			target_usernames: username,
			nested_post: "true"
		};
		Discourse.post( '/posts', params );
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
		Discourse.get( '/groups/' + permission.group.name + '/members.json', { limit: 9999 }, function( err, req, body ) {
			if ( ! body )
				return;
			var users = JSON.parse( body ).members;
			var usernames = [];
			// Check for users to remove
			if ( users && users.length > 0 ) {
				// Loop through discourse users
				for ( var u in users ) {
					var user = users[u];
					usernames.push( user.username );
					Discourse.checkDiscourseUser( user.username, permission );
				}
			}
			// Check for users to add
			Permissions.findOne( { slug: config.permission.member }, function( err, membership_permission ) {
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
		Permissions.findOne( { slug: config.permission.member }, function( err, membership_permission ) {
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
				if ( ! member ) {
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
					if ( ! perm.permission.group.order ) return false;
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
				if ( user )
					Discourse.put( '/admin/users/' + user.user.id + '/primary_group', { primary_group_id: permission.group.id } );
			} );
		} );
	},
	addUser: function( username, permission ) {
		api_tasks.push( function() {
			console.log( 'Adding user "' + username + '" to group "' + permission.group.name + '".' );
			var params = {
				usernames: username
			};
			Discourse.put( '/groups/' + permission.group.id + '/members.json', params );
		} );
	},
	removeUser: function( username, permission ) {
		api_tasks.push( function() {
			console.log( 'Fetching user "' + username + '".' );
			Discourse.getUsername( username, function( user ) {
				Discourse._removeUser( user.user, permission );
			} );
		} );
	},
	_removeUser: function ( user, permission ) {
		api_tasks.push( function() {
			console.log( 'Removing user "' + user.username + '" from group "' + permission.group.name + '".' );
			var params = {
				user_id: user.id
			};
			Discourse.del( '/groups/' + permission.group.id + '/members.json', params );
		} );
	}
};

setInterval( function() {
	if ( api_tasks.length > 0 )
		api_tasks.pop()();
}, 250 );

module.exports = Discourse;
