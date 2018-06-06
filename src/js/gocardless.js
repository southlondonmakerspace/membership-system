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

GoCardless.getSubscriptionName = function ( amount, period ) {
	return `Membership: £${amount} ${period}`;
}

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

// Customer

GoCardless.getCustomer = function ( customer_id, callback ) {
	GoCardless.request( 'get', '/customers/' + customer_id, null, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, JSON.parse( body ).customers );
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

GoCardless.createSubscription = function ( mandate_id, amount, interval_unit, callback ) {
	var data = {
		subscriptions: {
			amount: amount * 100, // Convert from £ to p
			currency: 'GBP',
			interval_unit: interval_unit === 'annually' ? 'yearly' : interval_unit,
			name: GoCardless.getSubscriptionName( amount, interval_unit ),
			links: {
				mandate: mandate_id
			}
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

GoCardless.updateSubscription = function ( subscription_id, amount, interval_unit, callback ) {
	var data = {
		subscriptions: {
			amount: amount * 100, // Convert from £ to p
			name: GoCardless.getSubscriptionName( amount, interval_unit )
		}
	};

	GoCardless.request( 'put', '/subscriptions/' + subscription_id, data, function ( error, response, body ) {
		if ( response.statusCode == 200 ) {
			callback( null, body );
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


// Promisify

Object.keys(GoCardless).forEach(method => {
	GoCardless[method + 'Promise'] = function (...methodArgs) {
		return new Promise((resolve, reject) => {
			GoCardless[method](...methodArgs, function (error, ...responseArgs) {
				if (error) {
					reject(error);
				} else {
					if (responseArgs.length <= 1) {
						resolve(responseArgs[0]);
					} else {
						resolve(responseArgs);
					}
				}
			});
		});
	};
});

module.exports = GoCardless;
