const express = require( 'express' );
const Papa = require('papaparse');

const auth = require( __js + '/authentication' );
const { Exports } = require( __js + '/database' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const { createSchema, updateSchema } = require('./schemas.json');

const exportTypes = require('./exports');

const app = express();
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
	res.render('index', {exports, exportTypes});
} ) );

app.post( '/', hasSchema(createSchema).orFlash, wrapAsync( async function( req, res ) {
	const { body: {type, description} } = req;

	const exportDetails = await Exports.create({type, description});
	req.flash('success', 'exports-created');
	res.redirect('/tools/exports/' + exportDetails._id);
} ) );

app.get( '/:uuid', wrapAsync( async function( req, res ) {
	const exportDetails = await Exports.findById(req.params.uuid);
	const exportType = exportTypes[exportDetails.type];

	const newItems = await exportType.collection.find({
		...await exportType.getQuery(),
		exports: {$not: {$elemMatch: {
			export_id: exportDetails
		}}}
	});

	const exportItems = await exportType.collection.find({
		exports: {$elemMatch: {
			export_id: exportDetails
		}}
	});

	exportItems.forEach(item => {
		item.currentExport = item.exports.find(e => e.export_id.equals(exportDetails._id));
	});

	const exportItemStatuses = exportType.statuses.map(status => ({
		name: status,
		count: exportItems.filter(item => item.currentExport.status === status).length
	}));

	res.render('export', {
		exportDetails,
		exportType,
		exportItems,
		exportItemStatuses,
		newItems
	});
} ) );

app.post( '/:uuid', hasSchema(updateSchema).orFlash, wrapAsync( async function( req, res ) {
	const data = req.body;

	const exportDetails = await Exports.findById(req.params.uuid);
	const exportType = exportTypes[exportDetails.type];

	if (data.action === 'add') {
		await exportType.collection.updateMany({
			...await exportType.getQuery(),
			exports: {$not: {$elemMatch: {
				export_id: exportDetails
			}}}
		}, {
			$push: {
				exports: {
					export_id: exportDetails,
					status: exportType.statuses[0]
				}
			}
		});

		req.flash('success', 'exports-added');
		res.redirect('/tools/exports/' + exportDetails._id);

	} else if (data.action === 'update') {
		await exportType.collection.updateMany({
			exports: {$elemMatch: {
				export_id: exportDetails,
				status: data.old_status
			}}
		},
		{
			$set: {
				'exports.$.status': data.status
			}
		});

		req.flash('success', 'exports-updated');
		res.redirect('/tools/exports/' + exportDetails._id);

	} else if (data.action === 'export') {
		const members = await exportType.collection.find({
			exports: {$elemMatch: {
				export_id: exportDetails,
				...data.status !== '' && {status: data.status}
			}}
		});

		const exportName = `export-${exportDetails.description}_${new Date().toISOString()}.csv`;
		const exportData = await exportType.getExport(members);
		res.attachment(exportName).send(Papa.unparse(exportData));
	} else if (data.action === 'delete') {
		await Exports.deleteOne({_id: exportDetails._id});
		await exportType.collection.updateMany({}, {
			$pull: {exports: {export_id: exportDetails._id}}
		});
		req.flash('success', 'exports-deleted');
		res.redirect('/tools/exports');
	}
} ) );

module.exports = function( config ) {
	app_config = config;
	return app;
};
