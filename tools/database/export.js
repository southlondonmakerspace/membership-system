global.__root = __dirname + '/../..';
global.__apps = __root + '/apps';
global.__config = __root + '/config/config.json';
global.__js = __root + '/src/js';
global.__models = __root + '/src/models';

const _ = require('lodash');
const config = require( __config );
const db = require( __js + '/database' );
const exportTypes = require('./types');

// Anonymise properties but maintain same mapping to keep links
let valueMap = {};
function anonymiseProperties(item, properties) {
	let newItem = JSON.parse(JSON.stringify(item));

	_.forEach(properties, (anonymiseFn, property) => {
		const value = _.get(item, property);
		if (value) {
			if (valueMap[value] === undefined) valueMap[value] = anonymiseFn();
			_.set(newItem, property, valueMap[value]);
		}
	});

	return newItem;
}

async function runExport({model, properties={}}) {
	console.error('Fetching', model.modelName);

	// Use native collection to reduce memory usage
	const items = await new Promise((resolve, reject) => {
		model.collection.find({}, (err, cursor) => {
			if (err) reject(err);
			else resolve(cursor.toArray());
		});
	});

	console.error(`Anonymising ${model.modelName}, got ${items.length} items`);
	const newItems = items.map(item => anonymiseProperties(item, properties));

	return {
		modelName: model.modelName,
		items: newItems
	};
}

async function main() {
	const exportData = await Promise.all(exportTypes.map(runExport));
	console.log(JSON.stringify(exportData));
}

db.connect(config.mongo);

db.mongoose.connection.on('connected', () => {
	main()
		.catch(err => console.error(err))
		.then(() => db.mongoose.disconnect());
});
