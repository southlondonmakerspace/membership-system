const test = require('ava');
const moment = require('moment');

const utils = require('../../tools/gocardless/sync-utils.js');

const __fixtures = '../fixtures/gocardless/sync';
const oneSubscription = require(__fixtures + '/oneSubscription.json');
const noSubscriptions = require(__fixtures + '/noSubscriptions.json');
const oneActiveSubscriptionWithSameEmail = require(__fixtures + '/oneActiveSubscriptionWithSameEmail.json');
const multipleActiveSubscriptionsWithSameEmail = require(__fixtures + '/multipleActiveSubscriptionsWithSameEmail.json');
const onlyPendingPayment = require(__fixtures + '/onlyPendingPayment.json');
const onlyFailedPayment = require(__fixtures + '/onlyFailedPayment.json');
const successfulAndPendingPayment = require(__fixtures + '/successfulAndPendingPayment.json');
const successfulAndFailedPayment = require(__fixtures + '/successfulAndFailedPayment.json');
const annualSubscription = require(__fixtures + '/annualSubscription.json');
const pendingPaymentWithAmountUpdate = require(__fixtures + '/pendingPaymentWithAmountUpdate.json');
const successfulPaymentWithAmountUpdate = require(__fixtures + '/successfulPaymentWithAmountUpdate.json');
const amountUpdateByNewSubscription = require(__fixtures + '/amountUpdateByNewSubscription.json');
const multipleInactiveSubscriptionsWithSameEmail = require(__fixtures + '/multipleInactiveSubscriptionsWithSameEmail.json');
const paymentWithNoSubscription = require(__fixtures + '/paymentWithNoSubscription.json');
const cancelledSubscription = require(__fixtures + '/cancelledSubscription.json');

// A not particularly thorough test that the data is merged into the right place
test('Merge data on one subscription', t => {
	const { customers, mandates, subscriptions, payments, subscriptionCancelledEvents } = oneSubscription;

	const mandate = {
		...mandates[0],
		subscriptions,
	};

	const subscription = {
		...subscriptions[0],
		payments,
		cancelledEvent: subscriptionCancelledEvents[0]
	};

	t.deepEqual(utils.mergeData(oneSubscription), [
		{
			...customers[0],
			mandates: [mandate],
			subscriptions: [subscription],
			payments: payments.map(payment => ({
				...payment,
				subscription: subscriptions[0]
			})),
			activeMandates: [mandate],
			activeSubscriptions: [subscription],
			latestActiveMandate: mandate,
			latestActiveSubscription: subscription
		}
	]);
});

test('Valid customers filter', t => {
	function testFilterCustomers(data, ids) {
		const customers = utils.filterCustomers(utils.mergeData(data));
		t.deepEqual(customers.map(c => c.id), ids);
	}

	testFilterCustomers(oneSubscription, ['CU38D9969CA774']);
	testFilterCustomers(oneActiveSubscriptionWithSameEmail, ['CU3C875BFEB5FA']);
	testFilterCustomers(noSubscriptions, []);
	testFilterCustomers(multipleActiveSubscriptionsWithSameEmail, []);
	testFilterCustomers(multipleInactiveSubscriptionsWithSameEmail, ['CU2B69A2C121AE']);
	testFilterCustomers(paymentWithNoSubscription, []);
});

test('Membership info', t => {
	function testMembershipInfo(data, expected) {
		const [customer] = utils.mergeData(data);
		const info = utils.getMembershipInfo(customer);
		t.is(info.amount, expected.amount);
		t.is(info.period, expected.period);
		t.is(info.starts.toISOString(), expected.starts.toISOString());
		t.is(info.expires.toISOString(), expected.expires.toISOString());
		t.deepEqual(info.pendingUpdate, {});
		if (info.cancelledAt) {
			t.is(info.cancelledAt.toISOString(), expected.cancelledAt.toISOString());
		} else {
			t.falsy(expected.cancelledAt);
		}
	}

	testMembershipInfo(onlyPendingPayment, {
		amount: 1,
		period: 'monthly',
		starts: moment.utc('2018-06-09T06:38:44.603Z'),
		expires: moment.utc('2018-06-15')
	});

	testMembershipInfo(onlyFailedPayment, {
		amount: 2,
		period: 'monthly',
		starts: moment.utc('2015-07-16T18:19:12.000Z'),
		expires: moment.utc('2015-07-21')
	});

	testMembershipInfo(oneSubscription, {
		amount: 3,
		period: 'monthly',
		starts: moment.utc('2016-07-20T05:38:17.573Z'),
		expires: moment.utc('2018-06-24')
	});

	testMembershipInfo(successfulAndPendingPayment, {
		amount: 3,
		period: 'monthly',
		starts: moment.utc('2017-10-13T15:55:06.730Z'),
		expires: moment.utc('2018-06-19')
	});

	testMembershipInfo(successfulAndFailedPayment, {
		amount: 1,
		period: 'monthly',
		starts: moment.utc('2014-11-07T05:59:11.000Z'),
		expires: moment.utc('2018-06-11')
	});

	testMembershipInfo(annualSubscription, {
		amount: 1,
		period: 'annually',
		starts: moment.utc('2017-02-24T11:11:23.189Z'),
		expires: moment.utc('2019-03-04')
	});

	testMembershipInfo(cancelledSubscription, {
		amount: 5,
		period: 'monthly',
		starts: moment.utc('2018-02-27T00:53:17.544Z'),
		expires: moment.utc('2018-07-05'),
		cancelledAt: moment.utc('2018-06-21T11:12:54.828Z')
	});
});

test('Membership info with pending updates', t => {
	function testMembershipInfo(data, expected) {
		const [customer] = utils.mergeData(data);
		const info = utils.getMembershipInfo(customer);
		t.is(info.amount, expected.amount);
		t.is(info.period, expected.period);
		t.is(info.starts.toISOString(), expected.starts.toISOString());
		t.is(info.expires.toISOString(), expected.expires.toISOString());
		t.falsy(info.createdAt);
		t.deepEqual(info.pendingUpdate, expected.pendingUpdate);
	}

	testMembershipInfo(pendingPaymentWithAmountUpdate, {
		amount: 5,
		period: 'monthly',
		starts: moment.utc('2018-06-12T18:55:47.872Z'),
		expires: moment.utc('2018-06-18'),
		pendingUpdate: {
			amount: 12,
			date:  moment.utc('2018-07-18').toDate()
		}
	});

	testMembershipInfo(successfulPaymentWithAmountUpdate, {
		amount: 9,
		period: 'annually',
		starts: moment.utc('2017-10-16T01:43:35.227Z'),
		expires: moment.utc('2018-11-22'),
		pendingUpdate: {
			amount: 20,
			date:  moment.utc('2018-11-22').toDate()
		}
	});
	
	testMembershipInfo(amountUpdateByNewSubscription, {
		amount: 5,
		period: 'monthly',
		starts: moment.utc('2017-09-19T05:40:54.359Z'),
		expires: moment.utc('2018-06-24'),
		pendingUpdate: {
			amount: 4,
			date: moment.utc('2018-06-23').toDate()
		}
	});
});
