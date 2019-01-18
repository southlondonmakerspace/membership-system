const test = require('ava');
const ajv = require('../src/js/ajv');

const { completeSchema } = require('../apps/profile/apps/complete/schemas.json');

const completeValidator = ajv.compile(completeSchema.body);

function isCompleteValid(t, data) {
	const valid = completeValidator(data);
	if (!valid) {
		console.log(completeValidator.errors);
	}
	t.true(valid);
}

function isCompleteInvalid(t, data) {
	t.false(completeValidator(data));
}

test('/complete valid no address', t => {
	isCompleteValid(t, {
		'email': 'blah@blah.com',
		'password': 'MyPassw0rd',
		'verify': 'MyPassw0rd',
		'delivery_optin': 'false',
		'reason': 'a reason',
		'how': 'a how'
	});
});

test('/complete valid with address', t => {
	isCompleteInvalid(t, {
		'email': 'blah@blah.com',
		'password': 'MyPassw0rd',
		'verify': 'MyPassw0rd',
		'delivery_optin': 'true',
		'delivery_line1': 'asdad'
	});

	isCompleteValid(t, {
		'email': 'blah@blah.com',
		'password': 'MyPassw0rd',
		'verify': 'MyPassw0rd',
		'delivery_optin': 'true',
		'delivery_line1': 'asdad',
		'delivery_city': 'Bristol',
		'delivery_postcode': 'BS1 1AA',
		'reason': 'a reason',
		'how': 'a how'
	});

	isCompleteValid(t, {
		'email': 'blah@blah.com',
		'password': 'MyPassw0rd',
		'verify': 'MyPassw0rd',
		'delivery_optin': 'true',
		'delivery_line1': 'asdad',
		'delivery_line2': '',
		'delivery_city': 'Bristol',
		'delivery_postcode': 'BS1 1AA',
		'reason': 'a reason',
		'how': 'a how'
	});
});

test('/complete invalid password', t => {
	const valid = completeValidator({
		'email': 'blah@blah.com',
		'password': 'password',
		'verify': 'password',
		'delivery_optin': 'false',
		'reason': 'a reason',
		'how': 'a how'
	});

	t.false(valid);

	t.is(completeValidator.errors.length, 1);

	const error = completeValidator.errors[0];
	t.is(error.keyword, 'format');
	t.is(error.params.format, 'password');
});
