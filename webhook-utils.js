const moment = require('moment');

function createPayment( gcPayment, now=new Date() ) {
	return {
		payment_id: gcPayment.id,
		created: new Date( gcPayment.created_at ),
		updated: now,
		status: gcPayment.status,
		description: gcPayment.description,
		amount: gcPayment.amount / 100,
		amount_refunded: gcPayment.amount_refunded / 100,
		charge_date: new Date( gcPayment.charge_date ),
		...gcPayment.links.subscription && { subscription_id: gcPayment.links.subscription }
	};
}

function getSubscriptionDuration({interval, interval_unit}) {
	const unit = interval_unit === 'weekly' ? 'weeks' :
		interval_unit === 'monthly' ? 'months' : 'years';
	return moment.duration({[unit]: interval});
}

module.exports = {
	createPayment,
	getSubscriptionDuration
};
