module.exports = {
	apps : [{
		name: 'app-dev',
		script: './app.js',
		env: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'webhook-dev',
		script:  './webhook.js',
		env: {
			NODE_ENV: 'production'
		}
	}]
};
