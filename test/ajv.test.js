const test = require('ava');
const ajv = require('../src/js/ajv');

// removeAdditional doesn't currently work as expected
test.skip('Removes unknown properties', t => {
	let data = {
		known: 1,
		unknown: true
	};

	ajv.validate({
		type: 'object',
		properties: {
			known: {
				type: 'integer'
			}
		}
	}, data);

	t.deepEqual(data, {known: 1});
});

test('Coerces types', t => {
	t.true(ajv.validate({type: 'number'}, '5'));

	t.false(ajv.validate({type: 'boolean'}, 'blah'));
	t.true(ajv.validate({type: 'boolean'}, 'false'));
});

test('oneOf works as expected', t => {
	const validator = ajv.compile({
		type: 'object',
		required: ['foo', 'bar'],
		properties: {
			foo: {
				type: 'string'
			},
			bar: {
				type: 'boolean'
			}
		},
		oneOf: [
			{
				required: ['prop1'],
				properties: {
					bar: {
						const: true
					},
					prop1: {
						type: 'integer'
					}
				}
			}, {
				properties: {
					bar: {
						const: false
					}
				}
			}
		]
	});

	t.false(validator({
		foo: 'blah',
		bar: true
	}));

	t.true(validator({
		foo: 'blah',
		bar: true,
		prop1: 1
	}));

	t.true(validator({
		foo: 'blah',
		bar: false,
		prop1: 0
	}));
});

test('password format', t => {
	const validator = ajv.compile({type: 'string', format: 'password'});

	t.false(validator('MyP4ss')); // Not long enough
	t.false(validator('Mypassword')); // No numbers
	t.false(validator('mypassw0rd')); // No A-Z
	t.false(validator('MYPASSW0RD')); // No a-z
	t.true(validator('MyPassw0rd'));
});

test('postcode format', t => {
	const validator = ajv.compile({type: 'string', format: 'postcode'});

	t.false(validator(''));
	t.false(validator('abc'));
	t.true(validator('BS1 1AA'));
	t.true(validator('bs1 1aa'));
	t.true(validator('BS11AA'));
	t.true(validator('GL52 1AA'));
	t.true(validator('N1 1AA'));
	t.true(validator('WC1A 1AA'));
	t.true(validator('E1W 1AA'));
	t.true(validator('B11 1AA'));
});
