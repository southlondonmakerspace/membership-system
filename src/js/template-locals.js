var config, apps = [];

function templateLocals( req, res, next ) {
	// Process which apps should be shown in menu
	res.locals.apps = {
		main: [],
		secondary: []
	};

	for ( var a in apps ) {
		var app = apps[a];
		if ( app.menu != "none" ) {
			if ( app.permissions != undefined && app.permissions != [] ) {
				if ( req.user ) {
					for ( var p in app.permissions ) {
						if ( req.user.quickPermissions.indexOf( app.permissions[p] ) != -1 ) {
							res.locals.apps[ app.menu ].push( app );
							break;
						}
					}
				} else {
					if ( app.permissions.indexOf( "loggedOut" ) != -1 )
						res.locals.apps[ app.menu ].push( app );
				}
			}
		}
	}

	// Template permissions
	res.locals.access = 'none';

	if ( req.user != undefined && req.user.quickPermissions != undefined ) {
		if ( req.user.quickPermissions.indexOf( 'member' ) != -1 ) res.locals.access = 'member';
		if ( req.user.quickPermissions.indexOf( 'admin' ) != -1 ) res.locals.access = 'admin';
		if ( req.user.quickPermissions.indexOf( 'superadmin' ) != -1 ) res.locals.access = 'superadmin';
		if ( req.user.quickPermissions.indexOf( 'director' ) != -1 ) res.locals.access = 'superadmin';
	}

	// Delete login redirect URL if user navigates to anything other than the login page
	if ( req.originalUrl != '/login' )
		delete req.session.requestedUrl;

	// Check if user is setup
	res.locals.userSetup = true;
	if ( req.user != undefined &&
		 (	req.user.emergency_contact.telephone == '' ||
			req.user.gocardless.mandate_id == '' ||
			req.user.gocardless.subscription_id == '' ||
			! req.user.discourse.activated ||
			req.user.discourse.username == '' ||
			req.user.tag.id == ''
		) )
		res.locals.userSetup = false;

	// Load config + prepare breadcrumbs
	res.locals.config = config.globals;
	res.locals.usersname = config.globals.title;
	if ( req.user != undefined ) res.locals.usersname = req.user.fullname;
	res.locals.breadcrumb = [];
	next();
};

module.exports = function( c, a ) {
	config = c;
	apps = a;
	return templateLocals;
}
