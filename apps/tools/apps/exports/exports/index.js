const activeMembers = require('./activeMembers');
const edition = require('./edition');
const joinReasons = require('./joinReasons');
const pollReasons = require('./pollReasons');
const referrals = require('./referrals');

module.exports = {
	'active-members': activeMembers,
	'edition': edition,
	'join-reasons': joinReasons,
	'poll-reasons': pollReasons,
	'referrals': referrals
};
