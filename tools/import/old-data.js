const fs = require('fs');
const Papa = require('papaparse');

const __root = __dirname + '/../..';
const __config = __root + '/config/config.json';
const __src = __root + '/src';
const __js = __src + '/js';

const config = require(__config);
const db = require(__js + '/database').connect(config.mongo);
const gocardless = require(__js + '/gocardless');

const { keyBy } = require('../utils');

async function loadData(file) {
	const customers = await gocardless.customers.all({limit: 500});

	const gcOverrides = customers
		.filter(customer => customer.metadata.user)
		.map(customer => {
			const [email, given_name, family_name] = customer.metadata.user.split('||');
			const [optin, line1, line2, city, postcode] = customer.metadata.delivery.split('||');

			return {
				gc_customer_id: customer.id,
				email, given_name, family_name,
				delivery_allow: optin,
				delivery_address1: line1,
				delivery_address2: line2,
				delivery_city: city,
				delivery_postcode: postcode,
				type: 'gc'
			};
		});

	if (file) {
		const wpFile = Papa.parse(fs.readFileSync(file).toString(), {
			header: true,
			skipEmptyLines: true
		});
		const wpOverrides = wpFile.data.map(row => ({...row, type: 'wp'}));
		return [...wpOverrides, ...gcOverrides];
	} else {
		return gcOverrides;
	}
}

async function syncData(overrides) {
	const permission = await db.Permissions.findOne({slug: 'member'});
	const members = await db.Members.find({permissions: {$elemMatch: {permission}}});

	const membersByCustomerId = keyBy(members, m => m.gocardless.customer_id);

	for (let override of overrides) {
		try {
			const member = membersByCustomerId[override.gc_customer_id];

			const delivery_optin = override.delivery_allow === '1';

			await member.update({$set: {
				email: override.email,
				firstname: override.given_name,
				lastname: override.family_name,
				delivery_optin,
				delivery_address: delivery_optin ? {
					line1: override.delivery_address1,
					line2: override.delivery_address2,
					city: override.delivery_city,
					postcode: override.delivery_postcode
				} : {}
			}});
		} catch (error) {
			console.log(override);
			console.log(error.message);
		}
	}
}

loadData(process.argv[2])
	.then(syncData)
	.catch(error => console.error(error))
	.then(() => db.mongoose.disconnect());
