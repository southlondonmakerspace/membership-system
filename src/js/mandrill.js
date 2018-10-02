const mandrill = require('mandrill-api/mandrill');
const moment = require('moment');
const config = require('../../config/config.json');

const client = new mandrill.Mandrill(config.mandrill.api_key);

const templates = {
	'welcome': member => [{
		name: 'REFERRALLINK',
		content: config.audience + '/join/referral/' + member.referralCode
	}],
	'reset-password': member => [{
		name: 'RPLINK',
		content: config.audience + '/password-reset/code/' + member.password.reset_code
	}],
	'cancelled-contribution': member => [{
		name: 'EXPIRES',
		content: moment(member.memberPermission.date_expires).format('dddd Do MMMM')
	}, {
		name: 'MEMBERSHIPID',
		content: member.uuid
	}],
	'cancelled-contribution-no-survey': member => [{
		name: 'EXPIRES',
		content: moment(member.memberPermission.date_expires).format('dddd Do MMMM')
	}],
	'restart-membership': (member, {code}) => [{
		name: 'RESTARTLINK',
		content: config.audience + '/join/restart/' + code
	}],
	'successful-referral': () => []
};

function memberToTemplate(templateId, member, params) {
	return {
		template_name: templateId,
		template_content: [],
		message: {
			to: [{
				email: member.email,
				name: member.fullname
			}],
			merge_vars: [{
				rcpt: member.email,
				vars: [
					{
						name: 'FNAME',
						content: member.firstname
					},
					...templates[templateId](member, params)
				]
			}],
		},
	};
}

module.exports = {
	sendToMember(templateId, member, params) {
		return new Promise((resolve, reject) => {
			client.messages.sendTemplate(memberToTemplate(templateId, member, params), resolve, reject);
		});
	},
	sendMessage(templateId, message) {
		return new Promise((resolve, reject) => {
			client.messages.sendTemplate({
				template_name: templateId,
				template_content: {},
				message
			}, resolve, reject);
		});
	},
	listTemplates() {
		return new Promise((resolve, reject) => {
			client.templates.list(resolve, reject);
		});
	}
};
