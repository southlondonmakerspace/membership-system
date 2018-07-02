const __root = __dirname + '/../..';
const __config = __root + '/config/config.json';
const __src = __root + '/src';
const __js = __src + '/js';

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
				LNAME: member.lastname
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

	console.log(`Got ${members.length} members`);

	// Hack to store membership active status somewhere
	members.forEach(member => {
		const memberPermission = member.permissions.find(p => permission.equals(p.permission));
		member.isActiveMember = memberPermission.date_added < moment() &&
			(!memberPermission.date_expires || memberPermission.date_expires > moment());
	});

	return members;
}

async function createBatch(members) {
	console.log('# Starting batch job');

	const operations = config.mailchimp.lists
		.map(listId => members.map(memberToOperation.bind(null, listId)))
		.reduce((a, b) => [...a, ...b], []);

	const updates = operations.filter(o => o.method === 'PUT').length;
	const deletes = operations.filter(o => o.method === 'DELETE').length;

	console.log(`Created ${operations.length} operations, ${updates} updates and ${deletes} deletes`);

	return await mailchimp.batches.create(operations);
}

async function waitForSync(batch) {
	console.log('# Got update for batch', batch.id);
	console.log('Status:', batch.status);
	console.log(`Operations: ${batch.finished_operations}/${batch.total_operations}`);
	console.log('Errors:', batch.errored_operations);

	if (batch.status === 'finished') {
		return batch;
	} else {
		await new Promise(resolve => setTimeout(resolve, 5000));
		return await waitForSync(await mailchimp.batches.get(batch.id));
	}
}

async function checkErrors(batch) {
	if (batch.errored_operations > 0) {
		console.log('# Checking errors');

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
	}
}

if (process.argv[2] === '-n') {
	fetchMembers(process.argv[3], process.argv[4])
		.then(members => {
			members.forEach(member => {
				console.log(member.isActiveMember ? 'U' : 'D', member.email);
			});
		})
		.catch(err => console.log(err))
		.then(() => db.mongoose.disconnect());
} else {
	fetchMembers(process.argv[2], process.argv[3])
		.then(createBatch)
		.then(waitForSync)
		.then(checkErrors)
		.catch(err => console.log(err))
		.then(() => db.mongoose.disconnect());
}
