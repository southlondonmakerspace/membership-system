const fs = require('fs');
const moment = require('moment');

const __root = __dirname + '/../..';
const __config = __root + '/config/config.json';
const __src = __root + '/src';
const __js = __src + '/js';

const config = require(__config);
const db = require(__js + '/database').connect(config.mongo);

const utils = require('./sync-utils.js');
const { keyBy } = require('../utils');
const { createPayment } = require('../../webhook-utils.js');

async function loadData(file) {
	console.log( '# Loading data from file...' );
	const data = JSON.parse(fs.readFileSync(file));

	console.log(`Got ${data.customers.length} customers`);
	console.log(`Got ${data.mandates.length} mandates`);
	console.log(`Got ${data.subscriptions.length} subscriptions`);
	console.log(`Got ${data.payments.length} payments`);
	console.log(`Got ${data.subscriptionCancelledEvents.length} subscription cancelled events`);

	return utils.mergeData(data);
}

function processCustomers(customers) {
	console.log('# Checking which records should be synced...');
	const validCustomers = utils.filterCustomers(customers);
	console.log(`Got ${validCustomers.length} valid customers`);
	return validCustomers;
}

async function syncCustomers(validCustomers) {
	console.log('# Syncing with database');

	const permission = await db.Permissions.findOne({slug: 'member'});
	const members = await db.Members.find({permissions: {$elemMatch: {permission}}});

	console.log(`Loaded ${members.length} members`);

	const membersByCustomerId = keyBy(members, m => m.gocardless.customer_id);

	await db.Payments.deleteMany({});

	let created = 0, updated = 0, payments = [];

	for (let customer of validCustomers) {
		try {
			let member = membersByCustomerId[customer.id];
			const membershipInfo = utils.getMembershipInfo(customer);

			const gocardless = {
				amount: membershipInfo.amount,
				period: membershipInfo.period,
				pending_update: membershipInfo.pendingUpdate,
				customer_id: customer.id,
				...customer.latestActiveMandate && {mandate_id: customer.latestActiveMandate.id},
				...customer.latestActiveSubscription && {subscription_id: customer.latestActiveSubscription.id},
				...membershipInfo.cancelledAt && {cancelled_at: membershipInfo.cancelledAt.toDate()}
			};

			const expires = membershipInfo.expires.add(config.gracePeriod).toDate();

			if (member) {
				// TODO: check if it needs updating
				member.gocardless = gocardless;
				member.memberPermission.date_added = membershipInfo.starts.toDate();
				member.memberPermission.date_expires = expires;
				await member.save();

				updated++;
			} else {
				member = await db.Members.create({
					firstname: customer.given_name,
					lastname: customer.family_name,
					email: customer.email,
					joined: moment(customer.created_at).toDate(),
					activated: true,
					gocardless,
					permissions: [{
						permission,
						date_added: membershipInfo.starts.toDate(),
						date_expires: expires
					}]
				});
				created++;
			}

			payments = [...payments, ...customer.payments.map(payment => ({
				...createPayment(payment),
				member: member._id
			}))];

			delete membersByCustomerId[customer.id];
		} catch (error) {
			console.log(customer.id, error.message);
		}
	}

	console.log('Created', created, 'members');
	console.log('Updated', updated, 'members');

	for (const customerId in membersByCustomerId) {
		const member = membersByCustomerId[customerId];
		console.log(member.email, 'was not updated');
	}

	console.log('Inserting', payments.length, 'payments');
	await db.Payments.collection.insertMany(payments, {ordered: false});
}

console.log( 'Starting...' );

loadData(process.argv[2])
	.then(processCustomers)
	.then(syncCustomers)
	.catch(error => {
		console.error(error);
	})
	.then(() => db.mongoose.disconnect());
