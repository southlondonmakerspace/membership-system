var	request = require( 'request' ),
	crypto = require( 'crypto' );

var GoCardless = function( config ) {
	GoCardless.config = config;

	if ( config.sandbox ) {
		config.url = 'https://api-sandbox.gocardless.com';
	} else {
		config.url = 'https://api.gocardless.com';
	}

	return GoCardless;
};

// Utilities

GoCardless.request = function ( method, path, json, callback ) {
	var options = {
		method: method,
		url: GoCardless.config.url + path,
		headers: {
			Authorization: 'Bearer ' + GoCardless.config.access_token,
			'GoCardless-Version': '2015-07-06'
		}
	};
	if ( json ) options.json = json;
	request( options, callback );
};

GoCardless.validateWebhook = function( webhook_signature, body, callback ) {
	var rehashed_webhook_signature = crypto.createHmac( 'sha256', GoCardless.config.secret ).update( body ).digest( 'hex' );

	if ( webhook_signature == rehashed_webhook_signature ) {
		callback( true );
		return;
	}

	callback( false );
};

// Redirect Flow

GoCardless.createRedirectFlow = function ( description, session_token, redirect_url, callback ) {
	var data = {
		redirect_flows: {
			description: description,
			session_token: session_token,
			success_redirect_url: redirect_url
		}
	};

	GoCardless.request( 'post', '/redirect_flows', data, function ( error, response, body ) {
		if ( response.statusCode == 201 ) {
			callback( null, body.redirect_flows.redirect_url, body );
		} else {
			callback( body );
		}
	} );
};

GoCardless.completeRedirectFlow = function ( redirect_flow_id, session_token, callback ) {
	var data = {
		data: {
			session_token: session_token
		}
	};

	GoCardless.request( 'post', '/redirect_flows/' + redirect_flow_id + '/actions/complete', data, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, body.redirect_flows.links.mandate, body );
		} else {
			callback( body );
		}
	} );
};

// Mandate

GoCardless.getMandate = function ( mandate_id, callback ) {
	GoCardless.request( 'get', '/mandates/' + mandate_id, null, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, JSON.parse( body ).mandates );
		} else {
			callback( body );
		}
	} );
};

GoCardless.cancelMandate = function ( mandate_id, callback ) {
	GoCardless.request( 'post', '/mandates/' +  mandate_id + '/actions/cancel', null, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, true, JSON.parse( body ) );
		} else {
			callback( body, false );
		}
	} );
};

// Subscription

GoCardless.createSubscription = function ( mandate_id, amount, day_of_month, description, metadata, callback ) {
	var data = {
		subscriptions: {
			amount: amount * 100, // Convert from £ to p
			currency: 'GBP',
			day_of_month: day_of_month,
			interval_unit: 'monthly',
			name: description,
			links: {
				mandate: mandate_id
			},
			metadata: metadata
		}
	};

	GoCardless.request( 'post', '/subscriptions', data, function ( error, response, body ) {
		if ( response.statusCode == 201 ) {
			callback( null, body.subscriptions.id, body );
		} else {
			callback( body );
		}
	} );
};

GoCardless.cancelSubscription = function ( subscription_id, callback ) {
	GoCardless.request( 'post', '/subscriptions/' +  subscription_id + '/actions/cancel', {}, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, true, body );
		} else {
			callback( body, false );
		}
	} );
};

GoCardless.getSubscription = function ( subscription_id, callback ) {
	GoCardless.request( 'get', '/subscriptions/' + subscription_id, null, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, JSON.parse( body ).subscriptions );
		} else {
			callback( body );
		}
	} );
};

// Payment

GoCardless.createPayment = function ( mandate_id, amount, description, callback ) {
	var data = {
		payments: {
			amount: amount * 100, // Convert from £ to p
			currency: 'GBP',
			description: description,
			links: {
				mandate: mandate_id
			}
		}
	};

	GoCardless.request( 'post', '/payments', data, function ( error, response, body ) {
		if ( response.statusCode == 201 ) {
			callback( null, body.payments.id, body );
		} else {
			callback( body );
		}
	} );
};

GoCardless.getPayment = function ( payment_id, callback ) {
	GoCardless.request( 'get', '/payments/' + payment_id, null, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, JSON.parse( body ).payments );
		} else {
			callback( body );
		}
	} );
};

module.exports = GoCardless;
