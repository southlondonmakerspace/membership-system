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

function sortByCreatedAt(a, b) {
	return a.created_at > b.created_at ? -1 : 1;
}

function getMostRecent(records) {
	return records.slice().sort(sortByCreatedAt)[0];
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

function getMembershipInfo(customer) {
	const successfulPayments = customer.payments.filter(isSuccessfulPayment);

	const payment = getMostRecent(successfulPayments.length > 0 ? successfulPayments : customer.payments);
	const {interval, interval_unit} = payment.subscription;

	const period = interval_unit === 'yearly' || interval === 12 ? 'annually' : 'monthly';

	const expires = isSuccessfulPayment(payment) ?
		moment(payment.charge_date).add(getSubscriptionDuration(payment.subscription)) :
		moment(customer.created_at);

	return {
		period,
		amount: payment.amount / (period === 'annually' ? 12 : 1) / 100,
		expires
	};
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
				activeSubscriptions
			};
		});
}

function filterValidCustomers(customers) {
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

		// Filter out customers who never had subscriptions, they probably
		// just gave a fixed donation
		// TODO: fix the weird annual ones?
		return customer.subscriptions.length > 0;
	});

	// A few customers have the same email address, for those ones only
	// take the active customer
	const potentialCustomersByEmail = groupBy(potentialCustomers, c => c.email);
	const validCustomers = Object.entries(potentialCustomersByEmail)
		.map(([email, customersWithSameEmail]) => {
			if (customersWithSameEmail.length === 1) {
				return customersWithSameEmail;
			} else {
				const activeCustomersWithSameEmail = customersWithSameEmail.filter(customer => (
					customer.activeSubscriptions.length > 0
				));
				if (activeCustomersWithSameEmail.length === 1) {
					return activeCustomersWithSameEmail;
				} else {
					console.error('Multiple active subscriptions for email', email);
					return [];
				}
			}
		})
		.reduce((a, b) => [...a, ...b], []);

	return validCustomers;
}

function customerToMember(customer, permission, gracePeriod) {
	const activeMandate = customer.activeMandates[0];
	const activeSubscription = customer.activeSubscriptions[0];

	const membership = getMembershipInfo(customer);

	// TODO: Calculate if subscription is changing

	return {
		firstname: customer.given_name,
		lastname: customer.family_name,
		email: customer.email,
		// TODO: fetch from WP/metadata
		delivery_optin: false,
		delivery_address: {
			line1: customer.address_line1,
			line2: customer.address_line2,
			city: customer.city,
			postcode: customer.postal_code
		},
		gocardless: {
			amount: membership.amount,
			period: membership.period,
			...activeMandate && {mandate_id: activeMandate.id},
			...activeSubscription && {subscription_id: activeSubscription.id}
		},
		activated: true,
		permissions: [{
			permission,
			date_added: moment(customer.created_at).toDate(),
			date_expires: membership.expires.add(gracePeriod).toDate()
		}]
	};
}

module.exports = {
	groupBy,
	keyBy,
	getMostRecent,
	isActiveMandate,
	isActiveSubscription,
	getMembershipInfo,
	mergeData,
	filterValidCustomers,
	customerToMember
};
