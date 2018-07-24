const utils = require('../../src/js/utils');

module.exports = {
	customerToMember(customer, mandateId) {
		return {
			firstname: customer.given_name,
			lastname: customer.family_name,
			email: customer.email,
			delivery_optin: false,
			delivery_address: {
				line1: customer.address_line1,
				line2: customer.address_line2,
				city: customer.city,
				postcode: customer.postal_code
			},
			gocardless: {
				customer_id: customer.id,
				mandate_id: mandateId
			},
			activated: true
		};
	},
	joinInfoToSubscription(amount, period, mandateId) {
		const actualAmount = utils.getActualAmount(amount, period);

		return {
			amount: actualAmount * 100,
			currency: 'GBP',
			interval_unit: period === 'annually' ? 'yearly' : 'monthly',
			name: utils.getSubscriptionName(actualAmount, period),
			links: {
				mandate: mandateId
			}
		};
	}
};
