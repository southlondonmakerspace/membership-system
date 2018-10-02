const __root = '../../../..';
const __src = __root + '/src';
const __js = __src + '/js';

const gocardless = require( __js + '/gocardless' );
const mailchimp = require( __js + '/mailchimp' );

async function syncMemberDetails(member, {email, firstname, lastname}) {
	await mailchimp.defaultLists.members.update( member.email, {
		email_address: email,
		merge_fields: {
			FNAME: firstname,
			LNAME: lastname
		}
	} );

	if ( member.gocardless.customer_id ) {
		await gocardless.customers.update( member.gocardless.customer_id, {
			email,
			given_name: firstname,
			family_name: lastname
		} );
	}
}

module.exports = {
	syncMemberDetails
};
