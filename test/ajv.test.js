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
