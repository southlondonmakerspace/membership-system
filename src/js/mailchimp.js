const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config/config.json');

const { log } = require('./logging');

function createInstance(endpoint) {
	const instance = axios.create({
		baseURL: `https://${config.mailchimp.datacenter}.api.mailchimp.com/3.0${endpoint}`,
		auth: {
			username: 'user',
			password: config.mailchimp.api_key
		}
	});

	instance.interceptors.request.use(config => {
		log.debug({
			app: 'mailchimp' + endpoint,
			url: config.url,
			method: config.method,
			sensitive: {
				params: config.params,
				data: config.data
			}
		});

		return config;
	});

	instance.interceptors.response.use(response => {
		return response;
	}, error => {
		log.error({
			app: 'mailchimp' + endpoint,
			status: error.response.status,
			data: error.response.data
		});
		return Promise.reject(error);
	});

	return instance;
}

function emailToHash(email) {
	return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}


function lists(listId) {
	const listInstance = createInstance('/lists/' + listId);

	return {
		members: {
			async create(email, data) {
				await listInstance.post('/members', {
					email_address: email,
					...data
				});
			},
			async unsert(email, data) {
				await listInstance.put('/members/' + emailToHash(email), data);
			},
			async update(email, data) {
				await listInstance.patch('/members/' + emailToHash(email), data);
			},
			async delete(email) {
				await listInstance.delete('/members/' + emailToHash(email));
			}
		}
	};
}

const batchInstance = createInstance('/batches');

module.exports = {
	instance: createInstance(''),
	lists,
	batches: {
		async create(operations) {
			const response = await batchInstance.post('/', {operations});
			return response.data;
		},
		async get(batchId) {
			const response = await batchInstance.get('/' + batchId);
			return response.data;
		}
	}
};
