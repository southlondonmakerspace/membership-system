module.exports = {
	apps : [{
		name: 'app',
		script: './app.js',
		env: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'webhook',
		script:  './webhook.js',
		env: {
			NODE_ENV: 'production'
		}
	}]
};
