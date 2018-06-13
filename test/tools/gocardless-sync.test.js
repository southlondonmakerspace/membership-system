const test = require('ava');

const utils = require('../../tools/gocardless/sync-utils.js');

const __fixtures = '../fixtures/gocardless';
const oneSubscription = require(__fixtures + '/sync/oneSubscription.json');
const noSubscriptions = require(__fixtures + '/sync/noSubscriptions.json');
const oneActiveSubscriptionWithSameEmail = require(__fixtures + '/sync/oneActiveSubscriptionWithSameEmail.json');
const multipleActiveSubscriptionsWithSameEmail = require(__fixtures + '/sync/multipleActiveSubscriptionsWithSameEmail.json');

test('Subscription info', t => {
	t.deepEqual(utils.getSubscriptionInfo({
		amount: 1200,
		interval: 1,
		interval_unit: 'yearly'
	}), {
		amount: 100,
		period: 'annually'
	});

	t.deepEqual(utils.getSubscriptionInfo({
		amount: 1200,
		interval: 1,
		interval_unit: 'monthly'
	}), {
		amount: 1200,
		period: 'monthly'
	});

	t.deepEqual(utils.getSubscriptionInfo({
		amount: 1200,
		interval: 12,
		interval_unit: 'monthly'
	}), {
		amount: 100,
		period: 'annually'
	});
});

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
		cancelledEvents: subscriptionCancelledEvents
	};

	t.deepEqual(utils.mergeData(oneSubscription), [
		{
			...customers[0],
			mandates: [mandate],
			subscriptions: [subscription],
			payments,
			activeMandates: [mandate],
			activeSubscriptions: [subscription]
		}
	]);
});

test('Active subscriptions filter', t => {
	const activeSubscriptions = oneActiveSubscriptionWithSameEmail.subscriptions.filter(utils.isActiveSubscription);
	t.is(activeSubscriptions.length, 1);
	t.is(activeSubscriptions[0].id, 'SB53DE80003DA4');
});

function testFilterValidCustomers(t, data, expectedLength) {
	const customers = utils.filterValidCustomers(utils.mergeData(data));
	t.is(customers.length, expectedLength);
	return customers;
}

test('Valid customers are not filtered out', t => {
	testFilterValidCustomers(t, oneSubscription, 1);
	const [customer] = testFilterValidCustomers(t, oneActiveSubscriptionWithSameEmail, 1);
	t.is(customer.id, 'CU3C875BFEB5FA');

	testFilterValidCustomers(t, noSubscriptions, 0);
	testFilterValidCustomers(t, multipleActiveSubscriptionsWithSameEmail, 0);
});

//test('Filter mandates'

// Just subscribed, only pending payment
// Subscribed but only failed payment
// Subscribed with a successful payment
// Just a donation
