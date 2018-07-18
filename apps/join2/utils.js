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
	joinFlowToSubscription(joinFlow, mandateId) {
		return {
			amount: joinFlow.actualAmount * 100,
			currency: 'GBP',
			interval_unit: joinFlow.period === 'annually' ? 'yearly' : 'monthly',
			name: utils.getSubscriptionName(joinFlow.actualAmount, joinFlow.period),
			links: {
				mandate: mandateId
			}
		};
	}
};
