var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

const Papa = require('papaparse');

var	express = require( 'express' ),
	app = express();

var	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Members = db.Members,
	Exports = db.Exports;

const config = require( __config + '/config.json' );

var auth = require( __js + '/authentication' );

const { wrapAsync } = require( __js + '/utils' );
const { hasSchema } = require( __js + '/middleware' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isAdmin );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = 'exports';
	next();
} );


app.get( '/', wrapAsync( async function( req, res ) {
	const exports = await Exports.find();
	res.render('index', {exports});
} ) );

const createSchema = {
	body: {
		type: 'object',
		required: ['description', 'type'],
		properties: {
			description: {
				type: 'string'
			},
			type: {
				type: 'string',
				enum: ['edition']
			}
		}
	}
};

app.post( '/', hasSchema(createSchema).orFlash, wrapAsync( async function( req, res ) {
	const { body: {type, description} } = req;

	const exportDetails = await Exports.create({type, description});
	res.redirect('/exports/' + exportDetails._id);
} ) );

app.get( '/:uuid', wrapAsync( async function( req, res ) {
	const exportDetails = await Exports.findOne({_id: req.params.uuid});
	const context = await exportHandlers[exportDetails.type].get(exportDetails);
	res.render(exportDetails.type, context);
} ) );

app.post( '/:uuid', wrapAsync( async function( req, res ) {
	const exportDetails = await Exports.findOne({_id: req.params.uuid});
	await exportHandlers[exportDetails.type].post(exportDetails, req.body, res);
} ) );

const exportHandlers = {
	edition: {
		get: getEditionExport,
		post: postEditionExport
	}
};

async function getEligibilityCriteria() {
	const permission = await Permissions.findOne( { slug: config.permission.member });
	return {
		'gocardless.amount': {$gte: 3},
		permissions: {$elemMatch: {
			permission,
			date_expires: {$gte: new Date()}
		}},
		delivery_optin: true
	};
}

async function getEditionExport(exportDetails) {
	const newMembersCount = await Members.count({
		...await getEligibilityCriteria(),
		exports: {$not: {$elemMatch: {
			export_id: exportDetails
		}}}
	});

	const exportMembers = await Members.find({
		exports: {$elemMatch: {
			export_id: exportDetails
		}}
	});

	exportMembers.forEach(member => {
		member.editionExport = member.exports.find(e => e.export_id.equals(exportDetails._id));
	});

	return {newMembersCount, exportMembers, exportDetails};
}

async function postEditionExport(exportDetails, data, res) {
	if (data.action === 'export') {
		const members = await Members.find({
			exports: {$elemMatch: {
				export_id: exportDetails,
				...data.status !== '' && {status: data.status}
			}}
		});

		const membersCsv = members.map(member => {
			return {
				firstname: member.firstname,
				lastname: member.lastname,
				delivery_address1: member.delivery_address.line1,
				delivery_address2: member.delivery_address.line2,
				city: member.delivery_address.city,
				postcode: member.delivery_address.postcode
			};
		});

		const blah = Papa.unparse(membersCsv);

		res.attachment('export.csv').send(blah);
	} else if (data.action === 'add') {
		// TODO: generate PDFs
		await Members.updateMany({
			...await getEligibilityCriteria(),
			exports: {$not: {$elemMatch: {
				export_id: exportDetails
			}}}
		}, {
			$push: {
				exports: {
					export_id: exportDetails,
					status: 'added'
				}
			}
		});

		res.redirect('/exports/' + exportDetails._id);
	} else if (data.action === 'update') {
		await Members.updateMany({
			exports: {$elemMatch: {
				export_id: exportDetails,
				...data.old_status !== '' && {status: data.old_status}
			}}
		},
		{
			$set: {
				'exports.$.status': data.status
			}
		});
		res.redirect('/exports/' + exportDetails._id);
	}
}

module.exports = function( config ) {
	app_config = config;
	return app;
};
