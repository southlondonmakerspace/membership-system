const { Members, Permissions, PollAnswers } = require(__js + '/database');
const config = require( __config );

async function getQuery() {
	const pollAnswers = await PollAnswers.find();
	const memberIds = pollAnswers.map(pollAnswer => pollAnswer.member);

	const permission = await Permissions.findOne( { slug: config.permission.member });

	return {
		_id: {$not: {$in: memberIds}},
		delivery_optin: true,
		'delivery_address.line1': {$exists: true},
		permissions: {$elemMatch: {
			permission,
			date_expires: {$gte: new Date()}
		}}
	};
}

async function getExport(members) {
	return members.map(member => ({
		'First name': member.firstname,
		Surname: member.lastname,
		'Full name': member.fullname,
		Address1: member.delivery_address.line1,
		Address2: member.delivery_address.line2,
		Address3: member.delivery_address.city,
		Address4: member.delivery_address.postcode,
		Custom1: 'thebristolcable.org/vote2019/' + member.pollsCode
	}));
}

module.exports = {
	name: 'Poll letter export',
	statuses: ['added', 'seen'],
	collection: Members,
	itemName: 'members',
	getQuery,
	getExport
};
