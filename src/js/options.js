var __home = __dirname + "/../..";
var __config = __home + '/config/config.json';
var __src = __home + '/src';
var __js = __src + '/js';

var config = require( __config );

var db = require( __js + '/database' ),
	OptionsDB = db.Options;

var defaults = require( __src + '/defaults.json' );

var _options = [];

var Options = {
	get: function( key, callback ) {
		callback( _options.find( function( opt ) {
			if ( opt.key == key ) return opt;
		} ) );
	},
	getText: function( key ) {
		var option = _options.find( function( opt ) {
			if ( opt.key == key ) return opt;
		} );
		if ( option ) {
			return option.value;
		} else {
			return;
		}
	},
	getInt: function( key ) {
		var option = _options.find( function( opt ) {
			if ( opt.key == key ) return opt;
		} );
		if ( option ) {
			return parseInt( option.value );
		} else {
			return;
		}
	},
	getBool: function( key ) {
		var option = _options.find( function( opt ) {
			if ( opt.key == key ) return opt;
		} );
		if ( option ) {
			switch ( option.value ) {
				case 'true':
					return true;
				case 'false':
					return false;
				default:
					return;
			}
		} else {
			return;
		}
	},
	getAll: function( callback ) {
		callback( _options );
	},
	set: function( key, value, callback ) {
		_options.find( function( opt ) {
			if ( opt.key == key ) {
				opt.default = false;
				opt.value = value;
				Options._save( key );
			}
		} );
		callback();
	},
	reset: function( key, callback ) {
		if ( defaults[key] ) {
			_options.find( function( opt ) {
				if ( opt.key == key ) {
					opt.default = true;
					opt.value = defaults[key];
					Options._unset( key );
				}
			} );
		}

		callback();
	},
	_save: function( key ) {
		OptionsDB.update( { key: key }, { value: Options.getText( key ) }, { upsert: true }, function( err, status ) {} );
	},
	_unset: function( key ) {
		OptionsDB.remove( { key: key }, function( err, status ) {} );
	},
	load: function( req, res, next ) {
		res.locals.Options = Options.getText;
		Options.loadFromDb(next);
	},
	loadFromDb: function (callback)
	{
		OptionsDB.find( function( err, opts ) {
			for ( var o in opts ) {
				var option = opts[o];
				_options.find( function( opt ) {
					if ( opt.key == option.key ) {
						opt.default = false;
						opt.value = option.value;
					}
				} )
			}
			callback();
		} );
	},
	firstTime: function () {
		var defaultKeys = Object.keys( defaults );
		defaultKeys.forEach( function( key ) {
			_options.push( {
				key: key,
				value: defaults[ key ],
				default: true
			} );
		} );
	}
};

module.exports = function() {
	if ( global.MS_Options == undefined ) {
		Options.firstTime();
		global.MS_Options = Options;
	}
	return global.MS_Options;
};
