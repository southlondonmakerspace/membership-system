const __root = __dirname + '/../..';
const __config = __root + '/config/config.json';
const __src = __root + '/src';
const __js = __src + '/js';

const Chance = require('chance');
const crypto = require('crypto');
const _ = require('lodash');
const mongoose = require('mongoose');

const config = require( __config );
const db = require( __js + '/database' ).connect( config.mongo );

const chance = new Chance();

function anonymiseId(len, prefix='') {
	return (prefix + crypto.randomBytes(6).toString('hex').slice(0, len)).toUpperCase();
}

const payments = {
	_id: () => new mongoose.Types.ObjectId(),
	payment_id: () => anonymiseId(12, 'PM'),
	subscription_id: () => anonymiseId(12, 'SB'),
	member: () => new mongoose.Types.ObjectId()
};

const members = {
	_id: () => new mongoose.Types.ObjectId(),
	guid: () => chance.guid({version: 4}),
	email: () => chance.email(),
	firstname: () => chance.first(),
	lastname: () => chance.last(),
	opt: () => ({}),
	password: () => ({}),
	join_reason: () => chance.sentence(),
	join_why: () => chance.sentence(),
	'gocardless.customer_id': () => anonymiseId(12, 'CU'),
	'gocardless.mandate_id': () => anonymiseId(12, 'MA'),
	'gocardless.subscription_id': () => anonymiseId(12, 'SB'),
	'delivery_address.line1': () => chance.address(),
	'delivery_address.line2': () => chance.pickone(['Cabot', 'Easton', 'Southmead']),
	'delivery_address.city': () => 'Bristol',
	'delivery_address.postcode': () => 'BS1 1AA',
	'cancellation.satisfied': () => chance.integer({min: 0, max: 5}),
	'cancellation.reason': () => chance.sentence(),
	'cancellation.other': () => chance.sentence()
};

const referrals = {
	_id: () => new mongoose.Types.ObjectId(),
	referrer: () => new mongoose.Types.ObjectId(),
	referee: () => new mongoose.Types.ObjectId()
};

const exportTypes = [
	{ model: db.Exports },
	{ model: db.JTJStock },
	{ model: db.Options },
	{ model: db.Permissions },
	{ model: db.Payments, properties: payments },
	{ model: db.Members, properties: members },
	{ model: db.Referrals, properties: referrals }
];

async function runExport() {
	let valueMap = {};

	function anonymiseProperties(item, properties) {
		let newItem = _.cloneDeep(item);

		_.forEach(properties, (anonymiseFn, property) => {
			const value = _.get(item, property);
			if (value) {
				if (!valueMap[value]) valueMap[value] = anonymiseFn();
				_.set(newItem, property, valueMap[value]);
			}
		});

		return newItem;
	}

	const out = await Promise.all(exportTypes.map(async ({model, properties={}}) => {
		const items = await model.find();
		return items.slice(0, 10).map(item => anonymiseProperties(item, properties));
	}));

	console.log(out);
}

runExport()
	.catch(err => console.error(err))
	.then(() => db.mongoose.disconnect());
