const __root = '../../../../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const { Members, Permissions } = require(__js + '/database');
const config = require( __config + '/config.json' );

async function getQuery() {
	const permission = await Permissions.findOne( { slug: config.permission.member });
	return {
		permissions: {$elemMatch: {
			permission,
			date_expires: {$gte: new Date()}
		}}
	};
}

async function getExport(members) {
	return members
		.map(member => ({
			EmailAddress: member.email,
			FirstName: member.firstname,
			LastName: member.lastname
		}))
		.sort((a, b) => a.EmailAddress < b.EmailAddress ? -1 : 1);
}

module.exports = {
	name: 'Active members export',
	statuses: ['added', 'seen'],
	collection: Members,
	itemName: 'active members',
	tableView: 'members',
	getQuery,
	getExport
};
