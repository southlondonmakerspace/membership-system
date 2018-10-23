module.exports = {
	apps : [{
		name: 'app',
		script: './app.js',
		out_file: '/var/log/membership-system/app-out.log',
		error_file: '/var/log/membership-system/app-err.log',
		env: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'webhook',
		script:  './webhook.js',
		out_file: '/var/log/membership-system/webhook-out.log',
		error_file: '/var/log/membership-system/webhook-err.log',
		env: {
			NODE_ENV: 'production'
		}
	}]
};
