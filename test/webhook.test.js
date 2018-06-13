const test = require('ava');
const moment = require('moment');

const config = require('../config/config.json');
const utils = require('../webhook-utils');

const __fixtures = './fixtures/gocardless';

const paymentWithSubscription = require(__fixtures + '/payments/paymentWithSubscription.json');
const paymentWithoutSubscription = require(__fixtures + '/payments/paymentWithoutSubscription.json');
const subscriptionOneYear = require(__fixtures + '/subscriptions/subscriptionOneYear.json');
const subscriptionOneMonth = require(__fixtures + '/subscriptions/subscriptionOneMonth.json');
const subscriptionTwelveMonths = require(__fixtures + '/subscriptions/subscriptionTwelveMonths.json');

test('payment with subscription', t => {
	const now = new Date();

	t.deepEqual(
		utils.createPayment(paymentWithSubscription, now),
		{
			payment_id: 'PM0009Z6BNTAAQ',
			created:	new Date( '2018-06-06T14:40:49.993Z' ),
			updated: now,
			description: 'Membership: £5 monthly',
			amount: 5,
			charge_date: new Date( '2018-06-12' ),
			subscription_id: 'SB0000FA7XH2FM',
			status: 'pending_submission'
		}
	);
});

test('payment without subscription', t => {
	const now = new Date();

	t.deepEqual(
		utils.createPayment(paymentWithoutSubscription, now),
		{
			payment_id: 'PM0009ZR048ZBT',
			created: new Date( '2018-06-07T13:02:33.029Z' ),
			updated: now,
			description: 'A test',
			amount: 10,
			charge_date: new Date( '2018-06-12' ),
			status: 'pending_submission'
		}
	);
});

test('subscription expiry with 1 year', t => {
	t.deepEqual(
		utils.getSubscriptionExpiry( paymentWithSubscription, subscriptionOneYear ),
		moment('2019-06-12').add(config.gracePeriod).toDate()
	);
});


test('subscription expiry with 1 month', t => {
	t.deepEqual(
		utils.getSubscriptionExpiry( paymentWithSubscription, subscriptionOneMonth ),
		moment('2018-07-12').add(config.gracePeriod).toDate()
	);
});


test('subscription expiry with 12 months', t => {
	t.deepEqual(
		utils.getSubscriptionExpiry( paymentWithSubscription, subscriptionTwelveMonths ),
		moment('2019-06-12').add(config.gracePeriod).toDate()
	);
});
