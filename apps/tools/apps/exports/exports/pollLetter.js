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
	return members.map(member => {
		const addressFields = Object.assign(
			...['line1', 'line2', 'city', 'postcode']
				.map(field => member.delivery_address[field])
				.filter(line => !!line)
				.map((field, i) => ({['Address' + (i + 1)]: field}))
		);

		return {
			'First name': member.firstname,
			Surname: member.lastname,
			'Full name': member.fullname,
			'Custom 1': 'thebristolcable.org/vote2019/' + member.pollsCode,
			...addressFields
		};
	});
}

module.exports = {
	name: 'Poll letter export',
	statuses: ['added', 'seen'],
	collection: Members,
	itemName: 'members',
	getQuery,
	getExport
};
