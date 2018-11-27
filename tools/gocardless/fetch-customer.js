global.__root = __dirname + '/../..';
global.__apps = __root + '/apps';
global.__config = __root + '/config/config.json';
global.__js = __root + '/src/js';
global.__models = __root + '/src/models';

const crypto = require('crypto');
const moment = require('moment');
const gocardless = require(__js + '/gocardless');

async function fetchCustomers(customerIds) {
	let customers = [], mandates = [], subscriptions = [], payments = [],
		subscriptionCancelledEvents = [];

	for (let customerId of customerIds) {
		const customer = await gocardless.customers.get(customerId);

		customers.push(customer);

		mandates.push(...await gocardless.mandates.all({
			limit: 500,
			customer: customer.id
		}));

		const customerSubscriptions = await gocardless.subscriptions.all({
			limit: 500,
			customer: customer.id
		});

		subscriptions.push(...customerSubscriptions);

		for (let subscription of subscriptions) {
			subscriptionCancelledEvents.push(...await gocardless.events.all({
				limit: 500,
				subscription: subscription.id,
				action: 'cancelled',
			}));
		}

		payments.push(...await gocardless.payments.all({
			limit: 500,
			customer: customer.id
		}));
	}

	console.error(`Got ${customers.length} customers`);
	console.error(`Got ${mandates.length} mandates`);
	console.error(`Got ${subscriptions.length} subscriptions`);
	console.error(`Got ${payments.length} payments`);
	console.error(`Got ${subscriptionCancelledEvents.length} subscription cancelled events`);

	return {customers, mandates, subscriptions, payments, subscriptionCancelledEvents};
}

function anonymiseData(data) {
	const customers = data.customers.map(anonymiseCustomer);
	const mandates = data.mandates.map(anonymiseMandate);
	const subscriptions = data.subscriptions.map(anonymiseSubscription);
	const payments = data.payments.map(anonymisePayment);
	const subscriptionCancelledEvents = data.subscriptionCancelledEvents.map(anonymiseSubscriptionCancelledEvent);

	return {customers, mandates, subscriptions, payments, subscriptionCancelledEvents};
}

// Anonymise IDs, but use same replacement to keep links
let idMap = {};
function anonymiseId(id, prefix='') {
	if (!id) {
		throw new Error('id is null');
	}

	if (!idMap[id]) {
		idMap[id] = (prefix + crypto.randomBytes(6).toString('hex').slice(0, 12)).toUpperCase();
	}
	return idMap[id];
}

// Anonymise dates but preserve order by moving them all by the same fixed amount
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
const dateAdjust = moment.duration(Math.round(Math.random() * 2 * WEEK_IN_SECONDS - WEEK_IN_SECONDS), 'seconds');
function anonymiseDate(date) {
	const newDate = moment(date).add(dateAdjust);
	return {
		iso: newDate.toISOString(),
		date: newDate.format('YYYY-MM-DD')
	};
}

function anonymiseCustomer(customer) {
	return {
		id: anonymiseId(customer.id, 'CU'),
		created_at: anonymiseDate(customer.created_at).iso,
		email: anonymiseId(customer.email) + '@test.com',
		given_name: 'Test',
		family_name: 'Test',
		company_name: '',
		address_line1: 'Test',
		address_line2: 'Test',
		address_line3: '',
		city: 'Test',
		region: '',
		postal_code: 'BS1 1AA',
		country_code: 'GB',
		language: 'en',
		swedish_identity_number: null,
		danish_identity_number: null,
		metadata: {}
	};
}

function anonymiseMandate(mandate) {
	return {
		...mandate,
		id: anonymiseId(mandate.id, 'MD'),
		created_at: anonymiseDate(mandate.created_at).iso,
		reference: anonymiseId(mandate.reference),
		next_possible_charge_date: anonymiseDate(mandate.next_possible_charge_date).date,
		metadata: {},
		links: {
			customer_bank_account: anonymiseId(mandate.links.customer_bank_account, 'BA'),
			creditor: anonymiseId(mandate.links.creditor, 'CR'),
			customer: anonymiseId(mandate.links.customer, 'CU')
		}
	};
}

function anonymiseSubscription(subscription) {
	return {
		...subscription,
		id: anonymiseId(subscription.id, 'SB'),
		created_at: anonymiseDate(subscription.created_at).iso,
		start_date: anonymiseDate(subscription.start_date).date,
		end_date: null,
		metadata: {},
		payment_reference: null,
		upcoming_payments: subscription.upcoming_payments.map(up => ({
			charge_date: anonymiseDate(up.charge_date).date,
			amount: up.amount
		})),
		app_fee: null,
		links: {
			mandate: anonymiseId(subscription.links.mandate, 'MD')
		}
	};
}

function anonymisePayment(payment) {
	return {
		...payment,
		id: anonymiseId(payment.id, 'PM'),
		created_at: anonymiseDate(payment.created_at).iso,
		charge_date: anonymiseDate(payment.charge_date).date,
		reference: null,
		metadata: {},
		links: {
			mandate: anonymiseId(payment.links.mandate, 'MD'),
			subscription: payment.links.subscription && anonymiseId(payment.links.subscription, 'SB')
		}
	};
}

function anonymiseSubscriptionCancelledEvent(event) {
	return {
		...event,
		id: anonymiseId(event.id, 'EV'),
		created_at: anonymiseDate(event.created_at).iso,
		metadata: {},
		links: {
			subscription: anonymiseId(event.links.subscription, 'SB')
		}
	};
}

function dumpData(data) {
	console.log(JSON.stringify(data, null, 2));
}

fetchCustomers(process.argv.slice(2))
	.then(anonymiseData)
	.then(dumpData)
	.catch(error => {
		console.error(error);
	});
