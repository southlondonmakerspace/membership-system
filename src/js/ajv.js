const Ajv = require('ajv');

const ajv = new Ajv({
	allErrors: true,
	coerceTypes: true,
	$data: true
});

ajv.addFormat( 'password', function ( password ) {
	if ( ! password )
		return false;

	if ( password.length < 8 )
		return false;

	if ( password.match( /\d/g ) === null )
		return false;

	if ( password.match( /[A-Z]/g ) === null )
		return false;

	if ( password.match( /[a-z]/g ) === null )
		return false;

	return true;
} );


module.exports = ajv;
