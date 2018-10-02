module.exports = {
	getSubscriptionName(amount, period) {
		return `Membership: £${amount} ${period}`;
	},
	getActualAmount(amount, period) {
		return amount * ( period === 'annually'  ? 12 : 1 );
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
