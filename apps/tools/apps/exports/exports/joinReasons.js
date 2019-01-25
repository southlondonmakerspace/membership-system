const { Members } = require(__js + '/database');

async function getQuery() {
	return {
		join_reason: {$exists: true, $ne: null}
	};
}

async function getExport(members) {
	return members
		.map(member => ({
			Shareable: member.join_shareable ? 'Yes' : 'No',
			Joined: member.joined,
			FirstName: member.firstname,
			Reason: member.join_reason,
			FirstHeard: member.join_how
		}));
}

module.exports = {
	name: 'Join reasons export',
	statuses: ['added', 'seen'],
	collection: Members,
	itemName: 'join reasons',
	getQuery,
	getExport
};
