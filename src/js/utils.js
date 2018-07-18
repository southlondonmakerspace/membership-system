module.exports = {
	getSubscriptionName(amount, period) {
		return `Membership: £${amount} ${period}`;
	},
	wrapAsync(fn) {
		return async (req, res, next) => {
			try {
				await fn(req, res);
			} catch (error) {
				req.log.error(error);
				next(error);
			}
		};
	}
};
