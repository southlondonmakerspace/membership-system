module.exports = {
	apps : [{
		name: 'app-dev',
		script: './app.js',
		out_file: '/var/log/membership-system-dev/app-out.log',
		error_file: '/var/log/membership-system-dev/app-err.log',
		env: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'webhook-dev',
		script:  './webhook.js',
		out_file: '/var/log/membership-system-dev/webhook-out.log',
		error_file: '/var/log/membership-system-dev/webhook-err.log',
		env: {
			NODE_ENV: 'production'
		}
	}]
};
