const { Members, PollAnswers } = require(__js + '/database');

async function getQuery() {
	return {
		reason: {$exists: true, $ne: null}
	};
}

async function getExport(pollAnswers) {
	const members = await Members.find();
	const membersById = {};
	members.forEach(member => membersById[member._id] = member);

	return pollAnswers
		.map(pollAnswer => ({
			Shareable: pollAnswer.shareable ? 'Yes' : 'No',
			FirstName: membersById[pollAnswer.member].firstname,
			Reason: pollAnswer.reason,
			Answer: pollAnswer.answer
		}));
}

module.exports = {
	name: 'Poll reasons export',
	statuses: ['added', 'seen'],
	collection: PollAnswers,
	itemName: 'poll reasons',
	getQuery,
	getExport
};
