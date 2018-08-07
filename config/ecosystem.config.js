module.exports = {
	apps : [{
		script: './app.js',
		env: {
			NODE_ENV: 'production'
		}
	}, {
		script:  './webhook.js',
		env: {
			NODE_ENV: 'production'
		}
	}]
};
