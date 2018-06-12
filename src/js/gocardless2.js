const axios = require('axios');
const crypto = require('crypto');
const uuid = require('uuid/v4');

const config = require('../../config/config.json');

const gocardless = axios.create({
	baseURL: `https://${config.gocardless.sandbox ? 'api-sandbox' : 'api'}.gocardless.com`,
	headers: {
		'Authorization': `Bearer ${config.gocardless.access_token}`,
		'GoCardless-Version': '2015-07-06',
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
});

gocardless.interceptors.request.use(config => {
	if (config.method === 'post') {
		config.headers['Idempotency-Key'] = uuid();
	}
	return config;
});

const STANDARD_METHODS = ['create', 'get', 'update', 'list', 'all'];

function createMethods(key, allowedMethods, allowedActions=[]) {
	const endpoint = `/${key}`;

	const standardMethods = {
		async create(data) {
			const response = await gocardless.post(endpoint, {[key]: data});
			return response.data[key];
		},
		async list(params) {
			const response = await gocardless.get(endpoint, {params});
			return response.data[key];
		},
		async all(params) {
			const {data: {meta, [key]: resources}} = await gocardless.get(endpoint, {params});

			const moreResources = meta.cursors.after ?
				await this.all({...params, after: meta.cursors.after}) : [];

			return [...resources, ...moreResources];
		},
		async get(id, params) {
			const response = await gocardless.get(`${endpoint}/${id}`, {params});
			return response.data[key];
		},
		async update(id, data) {
			const response = await gocardless.put(`${endpoint}/${id}`, {[key]: data});
			return response.data[key];
		}
	};

	function actionMethod(action) {
		return async (id, data) => {
			const response = await gocardless.post(`${endpoint}/${id}/actions/${action}`, {data});
			return response.data[key];
		};
	}

	return Object.assign(
		...allowedMethods.map(method => ({[method]: standardMethods[method]})),
		...allowedActions.map(action => ({[action]: actionMethod(action)}))
	);
}

module.exports = {
	creditors: createMethods('creditors', STANDARD_METHODS),
	creditorBankAccounts: createMethods('creditor_bank_accounts', ['create', 'get', 'list', 'all'], ['disable']),
	customers: createMethods('customers', STANDARD_METHODS),
	customerBankAccounts: createMethods('customer_bank_accounts', STANDARD_METHODS, ['disable']),
	events: createMethods('events', ['get', 'list', 'all']),
	mandates: createMethods('mandates', STANDARD_METHODS, ['cancel', 'reinstate']),
	mandateImports: createMethods('mandate_imports', ['create', 'get'], ['submit', 'cancel']),
	mandateImportEntries: createMethods('mandate_import_entries', ['create', 'list', 'all']),
	payments: createMethods('payments', STANDARD_METHODS, ['cancel', 'retry']),
	payouts: createMethods('payouts', ['get', 'list', 'all']),
	payoutItems: createMethods('payout_items', ['list', 'all']),
	redirectFlows: createMethods('redirect_flows', ['create', 'get'], ['complete']),
	refunds: createMethods('refunds', STANDARD_METHODS),
	subscriptions: createMethods('subscriptions', STANDARD_METHODS, ['cancel']),
	webhooks: {
		validate(req) {
			const rehashed_webhook_signature =
				crypto.createHmac( 'sha256', config.gocardless.secret ).update( req.body ).digest( 'hex' );

			return req.headers['content-type'] === 'application/json' &&
				req.headers['webhook-signature'] === rehashed_webhook_signature;
		}
	}
};
