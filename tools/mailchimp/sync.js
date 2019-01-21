global.__root = __dirname + '/../..';
global.__apps = __root + '/apps';
global.__config = __root + '/config/config.json';
global.__js = __root + '/src/js';
global.__models = __root + '/src/models';

const config = require( __config );

const axios = require( 'axios' );
const crypto = require( 'crypto' );
const JSONStream = require( 'JSONStream' );
const gunzip = require( 'gunzip-maybe' );
const moment = require( 'moment' );
const tar = require( 'tar-stream' );

const mailchimp = require( __js + '/mailchimp' );
const db = require( __js + '/database' ).connect( config.mongo );

function emailToHash(email) {
	return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

function memberToOperation(listId, member) {
	const path = 'lists/' + listId + '/members/' + emailToHash(member.email);

	return member.isActiveMember ? {
		path,
		method: 'PUT',
		body: JSON.stringify({
			email_address: member.email,
			merge_fields: {
				FNAME: member.firstname,
				LNAME: member.lastname,
				REFLINK: member.referralLink,
				CMPGN2019: member.campaign2019Answer
			},
			status_if_new: 'subscribed'
		})
	} : {
		path,
		method: 'DELETE',
		operation_id: 'delete'
	};
}

async function fetchMembers(startDate, endDate) {
	const dateFilter = {
		...startDate && {$gte: moment(startDate).toDate()},
		$lte: endDate ? moment(endDate).toDate() : new Date()
	};

	console.log('Start date:', startDate ? dateFilter.$gte.toISOString() : 'none');
	console.log('End date:', dateFilter.$lte.toISOString());

	console.log('# Fetching members');

	const permission = await db.Permissions.findOne({slug: 'member'});
	const members = await db.Members.find({
		permissions: {$elemMatch: {
			permission,
			$or: [
				{date_added: dateFilter},
				{date_expires: dateFilter}
			]
		}}
	});

	const answers = await db.PollAnswers.find({});

	console.log(`Got ${members.length} members`);

	return members.map(member => {
		const campaign2019Answer = (answers.find(answer => answer.member.equals(member._id)) || {}).answer || '';

		console.log(member.isActiveMember ? 'U' : 'D', member.email);

		return {
			firstname: member.firstname,
			lastname: member.lastname,
			email: member.email,
			referralLink: member.referralLink,
			isActiveMember: member.isActiveMember,
			campaign2019Answer
		};
	});
}

async function processMembers(members) {
	const operations = config.mailchimp.lists
		.map(listId => members.map(memberToOperation.bind(null, listId)))
		.reduce((a, b) => [...a, ...b], []);

	const updates = operations.filter(o => o.method === 'PUT').length;
	const deletes = operations.filter(o => o.method === 'DELETE').length;

	console.log(`Created ${operations.length} operations, ${updates} updates and ${deletes} deletes`);

	if (operations.length > 10) {
		return await createBatch(operations)
			.then(waitForBatch)
			.then(checkBatchErrors);
	} else {
		return await dispatchOperations(operations);
	}
}

async function createBatch(operations) {
	console.log('# Starting batch job');
	return await mailchimp.batches.create(operations);
}

async function waitForBatch(batch) {
	console.log('# Got update for batch', batch.id);
	console.log('Status:', batch.status);
	console.log(`Operations: ${batch.finished_operations}/${batch.total_operations}`);
	console.log('Errors:', batch.errored_operations);

	if (batch.status === 'finished') {
		return batch;
	} else {
		await new Promise(resolve => setTimeout(resolve, 5000));
		return await waitForBatch(await mailchimp.batches.get(batch.id));
	}
}

async function checkBatchErrors(batch) {
	console.log('# Checking errors');

	if (batch.errored_operations > 0) {
		console.log('Fetching response log file');

		const response = await axios({
			method: 'GET',
			url: batch.response_body_url,
			responseType: 'stream'
		});

		const extract = tar.extract();

		extract.on('entry', (header, stream, next) => {
			stream.on('end', next);

			if (header.type === 'file') {
				console.log('Checking file', header.name);
				stream.pipe(JSONStream.parse('*'))
					.on('data', data => {
						// Ignore 404s from delete operations
						if (data.status_code >= 400 &&
								(data.operation_id !== 'delete' || data.status_code !== 404)) {
							console.log(data);
						}
					});
			} else {
				stream.resume();
			}

		});

		await new Promise((resolve, reject) => {
			response.data
				.pipe(gunzip())
				.pipe(extract)
				.on('error', reject)
				.on('finish', resolve);
		});
	} else {
		console.log('No errors');
	}
}

async function dispatchOperations(operations) {
	for (const operation of operations) {
		await mailchimp.instance({
			method: operation.method,
			url: operation.path,
			...operation.body && {data: JSON.parse(operation.body)},
			validateStatus: status => {
				return status >= 200 && status < 300 ||
					operation.operation_id === 'delete' && status === 404;
			}
		});
	}
}

if (process.argv[2] === '-n') {
	fetchMembers(process.argv[3], process.argv[4])
		.catch(err => console.log(err))
		.then(() => db.mongoose.disconnect());
} else {
	fetchMembers(process.argv[2], process.argv[3])
		.then(processMembers)
		.catch(err => console.log(err))
		.then(() => db.mongoose.disconnect());
}
