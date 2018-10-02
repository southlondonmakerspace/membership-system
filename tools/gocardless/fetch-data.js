const gocardless = require('../../src/js/gocardless');

async function loadData() {
	console.error( '# Loading data from GoCardless...' );

	const customers = await gocardless.customers.all({limit: 500});
	const mandates = await gocardless.mandates.all({limit: 500});
	const subscriptions = await gocardless.subscriptions.all({limit: 500});
	const payments = await gocardless.payments.all({limit: 500});
	const subscriptionCancelledEvents = await gocardless.events.all({
		limit: 500,
		resource_type: 'subscriptions',
		action: 'cancelled',
	});

	console.error(`Got ${customers.length} customers`);
	console.error(`Got ${mandates.length} mandates`);
	console.error(`Got ${subscriptions.length} subscriptions`);
	console.error(`Got ${payments.length} payments`);
	console.error(`Got ${subscriptionCancelledEvents.length} subscription cancelled events`);

	return {customers, mandates, subscriptions, payments, subscriptionCancelledEvents};
}

function outputData(data) {
	console.log(JSON.stringify(data));
}

loadData(process.argv[2])
	.then(outputData)
	.catch(err => console.error(err));
