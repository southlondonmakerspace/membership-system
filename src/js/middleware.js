const Ajv = require('ajv');

var Options = require( './options' )();

const ajv = new Ajv({
	allErrors: true,
	removeAdditional: true,
	coerceTypes: true
});

function flashErrors( errors, req, res, next ) {
	errors
		.map( error => {
			switch ( error.keyword ) {
				case 'required':
					return `flash-validation-error${error.dataPath}.${error.params.missingProperty}-required`;
				default:
					return `flash-validation-error${error.dataPath}-${error.keyword}`;
			}
		} )
		.map( key => {
			return Options.getText( key ) || Options.getText('flash-validation-error-generic');
		} )
		.filter( ( value, index, arr ) => arr.indexOf( value ) === index )
		.forEach( message => req.flash( 'danger', message ) );

	res.redirect( req.originalUrl );
}

function send400( errors, req, res, next ) {
	res.status(400).send( errors );
}

function onRequest( validators, onErrors ) {
	return ( req, res, next ) => {
		const errors = Object.keys(validators).reduce( ( errors, key ) => {
			return validators[key]( req[key] ) ? [] : validators[key].errors;
		}, []);
		
		if ( errors.length > 0 ) {
			onErrors( errors, req, res, next );
		} else {
			next();
		}
	};
}

function hasSchema( schema, onErrors ) {
	const validators = {};

	for ( let key in schema ) {
		validators[key] = ajv.compile( schema[key] );
	}

	return {
		or400: onRequest( validators, send400 ),
		orFlash: onRequest( validators, flashErrors )
	};
};

module.exports = {
	hasSchema
};
