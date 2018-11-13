const axios = require('axois');

const instance = axios.create({
	baseURL: 'https://api.postcodes.io'
});

async function lookup(postcode) {
	const response = instance.get('/postcodes/' + postcode);
	return response.data;
}

async function bulkLookup(postcodes) {
	const response = instance.post('/postcodes', {postcodes});
	return response.data;
}

async function getLocation(postcode) {
	try {
		const postcodeData = await lookup(postcode);
		return {
			lat: postcodeData.result.latitude,
			lng: postcodeData.result.longitude
		};
	} catch (err) {
		return null;
	}
}

return {
	lookup,
	bulkLookup,
	getLocation
};
