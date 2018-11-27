const express = require( 'express' );
const busboy = require( 'connect-busboy' );
const Papa = require('papaparse');

const auth = require( __js + '/authentication' );
const { TransactionalEmails } = require( __js + '/database' );
const mandrill = require( __js + '/mandrill' );
const { wrapAsync } = require( __js + '/utils' );

const app = express();

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isAdmin );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'emails';
	next();
} );

app.get('/', wrapAsync(async (req, res) => {
	const transactionalEmails = await TransactionalEmails.aggregate([
		{$project: {
			name: 1,
			created: 1,
			sent: 1,
			numberOfRecipients: {$size: '$recipients'}
		}}
	]);
	console.log(transactionalEmails);

	res.render('index', {transactionalEmails});
}));

app.post('/', busboy(), (req, res) => {
	let name, recipients;
	req.busboy.on('file', (fieldname, file) => {
		Papa.parse(file, {
			header: true,
			complete: function (results) {
				recipients = results.data;
			}
		});
	});

	req.busboy.on('field', (fieldname, value) => {
		if (fieldname === 'name') {
			name = value;
		}
	});
	
	req.busboy.on('finish', async () => {
		const transactionalEmail = await TransactionalEmails.create({
			name,
			recipients
		});
		req.flash('success', 'transactional-email-created');
		res.redirect('/tools/emails/' + transactionalEmail._id);
	});

	req.pipe(req.busboy);
});

app.get('/:id', wrapAsync(async (req, res) => {
	const transactionalEmail = await TransactionalEmails.findOne({_id: req.params.id});
	const templates = await mandrill.listTemplates();
	res.render('email', {
		transactionalEmail,
		fields: Object.keys(transactionalEmail.recipients[0]),
		templates
	});
}));

app.post('/:id', wrapAsync(async (req, res) => {
	const { action, emailField, nameField, mergeKeys, mergeFields, template } = req.body;

	if (action === 'send') {
		const transactionalEmail = await TransactionalEmails.findOne({_id: req.params.id});

		const mergeVars = mergeKeys
			.map((key, i) => ({key, field: mergeFields[i]}))
			.filter(({key}) => !!key);

		const message = {
			to: transactionalEmail.recipients.map(recipient => ({
				email: recipient[emailField],
				name: recipient[nameField]
			})),
			merge_vars: transactionalEmail.recipients.map(recipient => {
				return {
					rcpt: recipient[emailField],
					vars: mergeVars.map(({key, field}) => ({
						name: key,
						content: recipient[field]
					}))
				};
			})
		};

		await mandrill.sendMessage(template, message);
		await transactionalEmail.update({$set: {sent: new Date()}});

		req.flash('success', 'transactional-email-sending');
		res.redirect('/tools/emails/' + transactionalEmail._id);
	} else if (action === 'delete') {
		await TransactionalEmails.deleteOne({_id: req.params.id});
		req.flash('success', 'transactional-email-deleted');
		res.redirect('/tools/emails');
	}
}));


module.exports = function( config ) {
	app_config = config;
	return app;
};
