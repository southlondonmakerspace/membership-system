global.__root = __dirname + '/../..';
global.__apps = __root + '/apps';
global.__config = __root + '/config/config.json';
global.__js = __root + '/src/js';
global.__models = __root + '/src/models';

const _ = require('lodash');
const fs = require('fs');
const config = require( __config );
const db = require( __js + '/database' );
const importTypes = require('./types');

const modelsByName = _.fromPairs(importTypes.map(({model}) => [model.modelName, model]));

async function runImport({modelName, items}) {
	console.error(`Importing ${modelName}, got ${items.length} items`);
	const model = modelsByName[modelName];
	await model.deleteMany({});
	try {
		await model.insertMany(items);
	} catch (err) {
		console.error(err);
	}
}

async function main(importData) {
	await Promise.all(importData.map(runImport));
}

db.connect(config.mongo);

db.mongoose.connection.on('connected', () => {
	main(JSON.parse(fs.readFileSync(process.argv[2])))
		.catch(err => console.error(err))
		.then(() => db.mongoose.disconnect());
});
