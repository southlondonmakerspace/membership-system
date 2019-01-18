const test = require('ava');
const { isLocalPostcode } = require('../apps/tools/apps/exports/utils');

test('is local postcide', t => {
	const locals = [3, 4, 5, 6, 7, 8, 9];
	for (const n of locals) {
		t.true(isLocalPostcode(`BS${n} 2AA`));
		t.true(isLocalPostcode(`BS${n}2AA`));
		t.true(isLocalPostcode(`BS${n}  2AA`));
		t.false(isLocalPostcode(`BS${n}1 2AA`));
	}

	t.false(isLocalPostcode('SW11 2AA'));
});
