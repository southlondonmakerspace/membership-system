function groupBy(arr, keyFn) {
	let ret = {};
	arr.forEach(el => {
		const key = keyFn(el);
		if (!ret[key]) ret[key] = [];
		ret[key].push(el);
	});
	return ret;
}

function keyBy(arr, keyFn) {
	let ret = {};
	arr.forEach(el => {
		ret[keyFn(el)] = el;
	});
	return ret;
}

module.exports = {
	groupBy,
	keyBy
};
