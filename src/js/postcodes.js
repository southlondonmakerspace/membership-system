const axios = require('axios');

const instance = axios.create({
	baseURL: 'https://api.postcodes.io'
});

async function lookup(postcode) {
	const response = await instance.get('/postcodes/' + postcode);
	return response.data.result;
}

async function bulkLookup(postcodes) {
	const response = await instance.post('/postcodes', {postcodes});
	return response.data;
}

async function getLocation(postcode) {
	try {
		const data = await lookup(postcode);
		return {
			lat: data.latitude,
			lng: data.longitude
		};
	} catch (err) {
		console.log(err);
		return null;
	}
}

module.exports = {
	lookup,
	bulkLookup,
	getLocation
};
