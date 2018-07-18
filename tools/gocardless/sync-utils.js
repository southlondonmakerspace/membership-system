const moment = require('moment');

const { getSubscriptionDuration } = require('../../webhook-utils');
const { groupBy, keyBy } = require('../utils');

// Helpers

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
	const subscriptionCancelledEventById = keyBy(data.subscriptionCancelledEvents, e => e.links.subscription);
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
					cancelledEvent: subscriptionCancelledEventById[subscription.id]
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
	const successfulPayments = customer.payments.filter(isSuccessfulPayment);
	const latestPayment =
		getLatestRecord(successfulPayments.length > 0 ? successfulPayments : customer.payments);
	const latestSubscription = getLatestRecord(customer.subscriptions);

	function getPeriodAndAmount() {
		const {interval, interval_unit} = latestPayment.subscription;
		const period = interval_unit === 'yearly' || interval === 12 ? 'annually' : 'monthly';
		return {
			period,
			amount: latestPayment.amount / (period === 'annually' ? 12 : 1) / 100,
		};
	}

	function getStartDate() {
		const subscription = isSuccessfulPayment(latestPayment) ?
			latestPayment.subscription : latestSubscription;
		return moment.utc(subscription.created_at);
	}

	function getExpiryDate() {
		return isSuccessfulPayment(latestPayment) ?
			moment.utc(latestPayment.charge_date).add(getSubscriptionDuration(latestPayment.subscription)) :
			moment.utc(latestSubscription.start_date);
	}

	function getPendingUpdate() {
		const activeSubscription = customer.latestActiveSubscription;

		if (activeSubscription && latestPayment.amount !== activeSubscription.amount) {
			const payment =
				activeSubscription.upcoming_payments.find(p => p.amount === activeSubscription.amount);
			return {
				amount: activeSubscription.amount / 100,
				...payment && {date: moment.utc(payment.charge_date).toDate()}
			};
		} else {
			return {};
		}
	}

	function getCancelledAt() {
		return latestSubscription.cancelledEvent &&
			moment.utc(latestSubscription.cancelledEvent.created_at);
	}

	return {
		...getPeriodAndAmount(),
		starts: getStartDate(),
		expires: getExpiryDate(),
		pendingUpdate: getPendingUpdate(),
		cancelledAt: getCancelledAt()
	};
}

module.exports = {
	mergeData,
	filterCustomers,
	getMembershipInfo
};
