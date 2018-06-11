const test = require('ava');
const ajv = require('../src/js/ajv');

const { joinSchema } = require('../apps/join2/schemas.json');

const joinValidator = ajv.compile(joinSchema.body);

function isJoinValid(t, data) {
	const valid = joinValidator(data);
	if (!valid) {
		console.log('Got errors:', joinValidator.errors);
	}
	t.true(valid);
}

function isJoinInvalid(t, data) {
	t.false(joinValidator(data));
}

test('/join valid monthly', t => {
	isJoinInvalid(t, {
		period: 'monthly',
		amount: 'abc'
	});

	isJoinValid(t, {
		period: 'monthly',
		amount: '3'
	});
});

test('/join monthly other', t => {
	isJoinInvalid(t, {
		period: 'monthly',
		amount: 'other'
	});

	isJoinInvalid(t, {
		period: 'annually',
		amount: 'other',
		amountOther: 'abc'
	});

	isJoinValid(t, {
		period: 'annually',
		amount: 'other',
		amountOther: '45'
	});
});
