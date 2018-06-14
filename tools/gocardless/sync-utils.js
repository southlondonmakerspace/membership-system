const moment = require('moment');

const { getSubscriptionDuration } = require('../../webhook-utils');

// Helpers

function groupBy(arr, keyFn) {
	let ret = {};
	arr.forEach(el => {
		const key = keyFn(el);
		if (!ret[key]) ret[key] = [];
		ret[key].push(el);
	});
	return ret;
}

function keyBy(arr, keyFn) {
	let ret = {};
	arr.forEach(el => {
		ret[keyFn(el)] = el;
	});
	return ret;
}

function getLatestRecord(records) {
	return records.slice().sort((a, b) => a.created_at > b.created_at ? -1 : 1)[0];
}

function isActiveMandate(mandate) {
	return ['pending_submission', 'submitted', 'active'].indexOf(mandate.status) > -1 &&
		mandate.subscriptions.length > 0;
}

function isActiveSubscription(subscription) {
	return subscription.status === 'active';
}

function isSuccessfulPayment(payment) {
	return ['confirmed', 'paid_out'].indexOf(payment.status) > -1;
}

// Heavy lifting methods

function mergeData(data) {
	const mandatesByCustomer = groupBy(data.mandates, m => m.links.customer);
	const subscriptionsByMandate = groupBy(data.subscriptions, s => s.links.mandate);
	const paymentsBySubscription = groupBy(data.payments, p => p.links.subscription);
	const subscriptionCancelledEventsById = groupBy(data.subscriptionCancelledEvents, e => e.links.subscription);
	const subscriptionById = keyBy(data.subscriptions, s => s.id);

	return data.customers
		.map(customer => {
			const customerMandates = mandatesByCustomer[customer.id] || [];
			const customerSubscriptions = customerMandates.reduce((agg, mandate) => (
				[...agg, ...subscriptionsByMandate[mandate.id] || []]
			), []);
			const customerPayments = customerSubscriptions.reduce((agg, subscription) => (
				[...agg, ...paymentsBySubscription[subscription.id] || []]
			), []);

			return {
				...customer,
				mandates: customerMandates.map(mandate => ({
					...mandate,
					subscriptions: subscriptionsByMandate[mandate.id] || []
				})),
				subscriptions: customerSubscriptions.map(subscription => ({
					...subscription,
					payments: paymentsBySubscription[subscription.id] || [],
					cancelledEvents: subscriptionCancelledEventsById[subscription.id] || []
				})),
				payments: customerPayments.map(payment => ({
					...payment,
					subscription: subscriptionById[payment.links.subscription]
				}))
			};
		})
		.map(customer => {
			const activeMandates = customer.mandates.filter(isActiveMandate);
			const activeSubscriptions = customer.subscriptions.filter(isActiveSubscription);

			return {
				...customer,
				activeMandates,
				activeSubscriptions,
				latestActiveMandate: getLatestRecord(activeMandates),
				latestActiveSubscription: getLatestRecord(activeSubscriptions)
			};
		});
}

function filterCustomers(customers) {
	const potentialCustomers = customers.filter(customer => {
		// These errors need to be fixed in GoCardless
		if (customer.activeMandates.length > 1) {
			console.error('Multiple active mandates for customer', customer.id);
			return false;
		}
		if (customer.activeSubscriptions.length > 1) {
			console.error('Multiple active subscriptions for customer', customer.id);
			return false;
		}
		if (customer.subscriptions.length === 0) {
			console.error('No subscriptions for customer', customer.id);
			return false;
		}
		if (customer.payments.every(p => !p.subscription)) {
			console.error('No payments are linked to a subscription for customer', customer.id);
			return false;
		}

		return true;
	});

	// Try to merge customers with the same email address
	const potentialCustomersByEmail = groupBy(potentialCustomers, c => c.email);
	const validCustomers = Object.entries(potentialCustomersByEmail)
		.map(([email, customersWithSameEmail]) => {
			if (customersWithSameEmail.length === 1) {
				return customersWithSameEmail;
			} else {
				const activeCustomersWithSameEmail = customersWithSameEmail.filter(customer => (
					customer.activeSubscriptions.length > 0
				));
				// Take the active one if there's only one
				if (activeCustomersWithSameEmail.length === 1) {
					return activeCustomersWithSameEmail;
				// Take the most recent one if all are inactive
				} else if (activeCustomersWithSameEmail.length === 0) {
					return [getLatestRecord(customersWithSameEmail)];
				} else {
					console.error('Multiple active subscriptions for email', email);
					return [];
				}
			}
		})
		.reduce((a, b) => [...a, ...b], []);

	return validCustomers;
}

function getMembershipInfo(customer) {
	function getPendingUpdate(subscription) {
		const payment = subscription.upcoming_payments.find(p => p.amount === subscription.amount);
		return {
			amount: subscription.amount / 100,
			...payment && {date: moment(payment.charge_date).toDate()}
		};
	}

	const successfulPayments = customer.payments.filter(isSuccessfulPayment);

	const payment = getLatestRecord(successfulPayments.length > 0 ? successfulPayments : customer.payments);
	const {interval, interval_unit} = payment.subscription;

	const period = interval_unit === 'yearly' || interval === 12 ? 'annually' : 'monthly';

	const expires = isSuccessfulPayment(payment) ?
		moment(payment.charge_date).add(getSubscriptionDuration(payment.subscription)) :
		moment(customer.created_at);

	const activeSubscription = customer.latestActiveSubscription;
	const pendingUpdate = activeSubscription && payment.amount !== activeSubscription.amount ?
		getPendingUpdate(activeSubscription) : {};

	return {
		period,
		amount: payment.amount / (period === 'annually' ? 12 : 1) / 100,
		expires,
		pendingUpdate
	};
}

module.exports = {
	groupBy,
	keyBy,
	mergeData,
	filterCustomers,
	getMembershipInfo
};
