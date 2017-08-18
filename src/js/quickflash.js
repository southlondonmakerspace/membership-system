var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';

var Options = require( __js + '/options' )();

module.exports = function( req, res, next ) {
	var flash = req.flash(),
		flashes = [],
		types = Object.keys( flash );

	for ( var t in types ) {
		var key = types[ t ];
		var messages = flash[ key ];

		for ( var m in messages ) {
			var message = messages[ m ];
			var option = Options.getText( 'flash-' + message );

			if ( ! option ) {
				option = message;
			}

			flashes.push( {
				type: key == 'error' ? 'danger' : key,
				message: option
			} );
		}
	}
	res.locals.flashes = flashes;
	next();
};
