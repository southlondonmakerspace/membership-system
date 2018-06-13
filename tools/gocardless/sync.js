const fs = require('fs');

const __root = __dirname + '/../..';
const __config = __root + '/config/config.json';
const __src = __root + '/src';
const __js = __src + '/js';

const config = require(__config);
const db = require(__js + '/database').connect(config.mongo);
const gocardless = require(__js + '/gocardless');

const utils = require('./sync-utils.js');

async function loadData(file=null) {
	let data;

	if (file) {
		console.log( '# Loading data from file...' );
		data = JSON.parse(fs.readFileSync(file));
	} else {
		console.log( '# Loading data from GoCardless...' );

		const customers = await gocardless.customers.all({limit: 500});
		const mandates = await gocardless.mandates.all({limit: 500});
		const subscriptions = await gocardless.subscriptions.all({limit: 500});
		const payments = await gocardless.payments.all({limit: 500});
		const subscriptionCancelledEvents = await gocardless.events.all({
			limit: 500,
			resource_type: 'subscriptions',
			action: 'cancelled',
		});

		data = { customers, mandates, subscriptions, payments, subscriptionCancelledEvents };
		fs.writeFileSync( 'data.json', JSON.stringify(data));
	}

	console.log(`Got ${data.customers.length} customers`);
	console.log(`Got ${data.mandates.length} mandates`);
	console.log(`Got ${data.subscriptions.length} subscriptions`);
	console.log(`Got ${data.payments.length} payments`);
	console.log(`Got ${data.subscriptionCancelledEvents.length} subscription cancelled events`);

	return utils.mergeData(data);
}

function processCustomers(customers) {
	console.log('# Checking which records should be synced...');
	const validCustomers = utils.filterValidCustomers(customers);
	console.log(`Got ${validCustomers.length} valid customers`);
	return validCustomers;
}

async function syncCustomers(validCustomers) {
	console.log('# Syncing with database');

	const permission = await db.Permissions.findOne({slug: 'member'});
	const members = await db.Members.find({permissions: {$elemMatch: {permission}}});

	console.log(`Loaded ${members.length} members`);

	const membersByEmail = utils.keyBy(members, m => m.email);
	const validCustomersWithMember = validCustomers.map(customer => {
		return {...customer, member: membersByEmail[customer.email]};
	});

	const {updates, inserts} = utils.groupBy(validCustomersWithMember, customer => {
		return customer.member ? 'updates': 'inserts';
	});

	console.log(`Got ${updates.length} updates`);
	console.log(`Got ${inserts.length} inserts`);

	// TODO: sync payments

	// TODO: remove unwanted?
}

console.log( 'Starting...' );

loadData(process.argv[2])
	.then(processCustomers)
	.then(syncCustomers)
	.catch(error => {
		console.error(error);
	})
	.then(() => db.mongoose.disconnect());
