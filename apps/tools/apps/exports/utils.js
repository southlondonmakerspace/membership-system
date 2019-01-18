module.exports = {
	isLocalPostcode: postcode => (
		/^BS[3-9]\D?$/.test(postcode.replace(/ /g, '').slice(0, -3))
	)
};
