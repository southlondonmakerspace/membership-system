module.exports = function( req, res, next ) {
	var flash = req.flash(),
		flashes = [],
		types = Object.keys( flash );

	for ( var t in types ) {
		var key = types[ t ];
		var messages = flash[ key ];
		for ( var m in messages ) {
			var message = messages[ m ];
			flashes.push( {
				type: key == 'error' ? 'danger' : key,
				message: message
			} );
		}
	}
	res.locals.flashes = flashes;
	next();
}