const ajv = require('./ajv');

const Options = require( './options' )();
const config = require( '../../config/config.json' );

function flashErrors( errors, req, res, next ) { // eslint-disable-line no-unused-vars
	errors
		.map( error => {
			console.log( error );
			switch ( error.keyword ) {
			case 'required':
				return `flash-validation-error${error.dataPath}.${error.params.missingProperty}-required`;
			case 'format':
				return `flash-validation-error.${error.params.format}-format`;
			default:
				return `flash-validation-error${error.dataPath}-${error.keyword}`;
			}
		} )
		.map( key => {
			return Options.getText( key ) ||
				(config.dev ? key : Options.getText('flash-validation-error-generic'));
		} )
	// Don't show duplicate errors twice
		.filter( ( value, index, arr ) => arr.indexOf( value ) === index )
		.forEach( message => req.flash( 'danger', message ) );

	res.redirect( req.originalUrl );
}

function send400( errors, req, res, next ) { // eslint-disable-line no-unused-vars
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

function hasSchema( schema ) {
	const validators = {};

	for ( let key in schema ) {
		validators[key] = ajv.compile( schema[key] );
	}

	return {
		or400: onRequest( validators, send400 ),
		orFlash: onRequest( validators, flashErrors )
	};
}

module.exports = {
	hasSchema
};
