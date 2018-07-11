const test = require('ava');
const moment = require('moment');

const utils = require('../webhook-utils');

const __fixtures = './fixtures/gocardless';

const paymentWithSubscription = require(__fixtures + '/payments/paymentWithSubscription.json');
const paymentWithoutSubscription = require(__fixtures + '/payments/paymentWithoutSubscription.json');
const paymentWithRefund = require(__fixtures + '/payments/paymentWithRefund.json');
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
			amount_refunded: 0,
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
			amount_refunded: 0,
			charge_date: new Date( '2018-06-12' ),
			status: 'pending_submission'
		}
	);
});

test('payment with refund', t => {
	const now = new Date();

	t.deepEqual(
		utils.createPayment(paymentWithRefund, now),
		{
			payment_id: 'PM00000000000',
			created: new Date( '2017-12-03T05:00:00.00Z' ),
			updated: now,
			description: 'Test payment',
			amount: 12,
			amount_refunded: 12,
			charge_date: new Date( '2017-12-06' ),
			subscription_id: 'SB000000000000',
			status: 'paid_out'
		}
	);
});

test('subscription duration', t => {
	t.deepEqual(
		utils.getSubscriptionDuration( subscriptionOneYear ),
		moment.duration(1, 'year')
	);

	t.deepEqual(
		utils.getSubscriptionDuration( subscriptionOneMonth ),
		moment.duration(1, 'month')
	);

	t.deepEqual(
		utils.getSubscriptionDuration( subscriptionTwelveMonths ),
		moment.duration(1, 'year')
	);
});
