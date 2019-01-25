const { Members, Permissions } = require(__js + '/database');
const { isLocalPostcode } = require( '../utils.js' );
const config = require( __config );

async function getQuery() {
	const permission = await Permissions.findOne( { slug: config.permission.member });
	return {
		'gocardless.amount': {$gte: 3},
		permissions: {$elemMatch: {
			permission,
			date_expires: {$gte: new Date()}
		}},
		delivery_optin: true
	};
}

async function getExport(members) {
	return members
		.map(member => {
			const postcode = (member.delivery_address.postcode || '').trim().toUpperCase();
			return {
				FirstName: member.firstname,
				LastName: member.lastname,
				Address1: member.delivery_address.line1,
				Address2: member.delivery_address.line2,
				City: member.delivery_address.city,
				Postcode: postcode,
				IsLocal: isLocalPostcode(postcode),
				ReferralLink: member.referralLink
			};
		})
		.sort((a, b) => (
			(b.IsLocal - a.IsLocal) ||
				(b.LastName.toLowerCase() > a.LastName.toLowerCase() ? -1 : 1)
		));
}

module.exports = {
	name: 'Edition export',
	statuses: ['added', 'sent'],
	collection: Members,
	itemName: 'members',
	getQuery,
	getExport
};
