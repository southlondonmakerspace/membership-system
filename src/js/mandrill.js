const mandrill = require('mandrill-api/mandrill');
const moment = require('moment');
const config = require('../../config/config.json');

const client = new mandrill.Mandrill(config.mandrill.api_key);

const templates = {
	welcome: () => [],
	'reset-password': member => [{
		name: 'RPLINK',
		content: config.audience + '/password-reset/code/' + member.password.reset_code
	}],
	'cancelled-contribution': member => {
		return [{
			name: 'EXPIRES',
			content: moment(member.memberPermission.date_expires).format('dddd Do MMMM')
		}];
	}
};

function memberToTemplate(templateId, member) {
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
					...templates[templateId](member)
				]
			}],
		},
	};
}

module.exports = {
	send(templateId, member) {
		return new Promise((resolve, reject) => {
			client.messages.sendTemplate(memberToTemplate(templateId, member), resolve, reject);
		});
	}
};
