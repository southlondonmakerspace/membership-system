const __root = __dirname + '/../..';
const __src = __root + '/src';
const __js = __src + '/js';

const Chance = require('chance');
const crypto = require('crypto');
const mongoose = require('mongoose');

const db = require( __js + '/database' );

const chance = new Chance();

// TODO: anonymise dates

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
	uuid: () => chance.guid({version: 4}),
	email: () => chance.email(),
	firstname: () => chance.first(),
	lastname: () => chance.last(),
	otp: () => ({}),
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

module.exports = [
	{ model: db.Exports },
	{ model: db.JTJStock },
	{ model: db.Options },
	{ model: db.Permissions },
	{ model: db.Payments, properties: payments },
	{ model: db.Members, properties: members },
	{ model: db.Referrals, properties: referrals }
];
