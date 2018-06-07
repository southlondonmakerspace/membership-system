const moment = require('moment');

const config = require('./config/config.json');

function createPayment( gcPayment, now=new Date() ) {
	return {
		payment_id: gcPayment.id,
		created: new Date( gcPayment.created_at ),
		updated: now,
		status: gcPayment.status,
		description: gcPayment.description,
		amount: gcPayment.amount / 100,
		charge_date: new Date( gcPayment.charge_date ),
		...gcPayment.links.subscription && { subscription_id: gcPayment.links.subscription }
	};
}

function getSubscriptionExpiry( payment, subscription ) {
	const unit = subscription.interval_unit === 'weekly' ? 'weeks' :
		subscription.interval_unit === 'monthly' ? 'months' : 'years'

	const date = moment( payment.charge_date )
		.add( { [unit]: subscription.interval } )
		.add( config.gracePeriod );

	return date.toDate();
}

module.exports = {
  createPayment,
  getSubscriptionExpiry
};
