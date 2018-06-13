const moment = require('moment');

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

function getSubscriptionInfo({amount, interval, interval_unit}) {
	const period = interval_unit === 'yearly' || interval === 12 ? 'annually' : 'monthly';
	return {
		period,
		amount: amount / (period === 'annually' ? 12 : 1)
	};
}

function isActiveMandate(mandate) {
	return ['pending_submission', 'submitted', 'active'].indexOf(mandate.status) > -1 &&
		mandate.subscriptions.length > 0;
}

function isActiveSubscription(subscription) {
	return subscription.status === 'active';
}

function mergeData(data) {
	const mandatesByCustomer = groupBy(data.mandates, m => m.links.customer);
	const subscriptionsByMandate = groupBy(data.subscriptions, s => s.links.mandate);
	const paymentsBySubscription = groupBy(data.payments, p => p.links.subscription);
	const subscriptionCancelledEventsById = groupBy(data.subscriptionCancelledEvents, e => e.links.subscription);

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
				payments: customerPayments
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
	const activeMandate = getMostRecent(customer.activeMandates);
	const activeSubscription = getMostRecent(customer.activeSubscriptions);

	const subscriptionInfo = {};
	const subscriptionExpires = moment(customer.created_at).add(gracePeriod).toDate();

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
			...activeMandate && {mandate_id: activeMandate.id},
			...activeSubscription && {subscription_id: activeSubscription.id},
			...subscriptionInfo
		},
		activated: true,
		permissions: [{
			permission,
			date_added: moment(customer.created_at).toDate(),
			date_expires: subscriptionExpires
		}]
	};
}

module.exports = {
	groupBy,
	keyBy,
	getMostRecent,
	getSubscriptionInfo,
	isActiveMandate,
	isActiveSubscription,
	mergeData,
	filterValidCustomers,
	customerToMember
};
